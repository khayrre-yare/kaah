using backend.Data;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .OrderByDescending(user => user.CreatedDate)
            .Select(user => new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                user.CreatedDate
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentUserId)
            return BadRequest(new { message = "Admin-ka hadda login-gareysan lama tirtiri karo" });

        var user = await _context.Users
            .Include(user => user.Borrows!)
                .ThenInclude(borrow => borrow.Book)
            .Include(user => user.Orders!)
                .ThenInclude(order => order.Details!)
            .FirstOrDefaultAsync(user => user.Id == id);

        if (user == null)
            return NotFound(new { message = "User-ka lama helin" });

        if (user.Role == "Admin")
        {
            var adminCount = await _context.Users.CountAsync(item => item.Role == "Admin");
            if (adminCount <= 1)
                return BadRequest(new { message = "Admin-ka ugu dambeeya lama tirtiri karo" });
        }

        foreach (var borrow in user.Borrows ?? [])
        {
            if ((borrow.Status == "Approved" || borrow.Status == "Active") && borrow.Book != null)
                borrow.Book.Quantity++;
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { message = "User-ka iyo records-kiisa waa la tirtiray" });
    }
}
