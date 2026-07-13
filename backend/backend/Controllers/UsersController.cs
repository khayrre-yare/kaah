using backend.Data;
using backend.Models;
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

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserDto dto)
    {
        var fullName = dto.FullName?.Trim();
        var email = dto.Email?.Trim();
        var password = dto.Password?.Trim();
        var role = dto.Role?.Trim();

        if (string.IsNullOrWhiteSpace(fullName))
            return BadRequest(new { message = "Magaca user-ka waa qasab" });

        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Email-ka user-ka waa qasab" });

        if (string.IsNullOrWhiteSpace(password))
            return BadRequest(new { message = "Password-ka waa qasab" });

        if (role != "Admin" && role != "User")
            return BadRequest(new { message = "Role-ku waa inuu noqdaa Admin ama User" });

        var emailExists = await _context.Users.AnyAsync(item => item.Email != null && item.Email.ToLower() == email.ToLower());
        if (emailExists)
            return BadRequest(new { message = "Email-kan horay ayaa loo diiwaangeliyay" });

        var user = new Users
        {
            FullName = fullName,
            Email = email,
            PasswordHash = password,
            Role = role,
            CreatedDate = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.CreatedDate
        });
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

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateUserDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "User-ka lama helin" });

        var fullName = dto.FullName?.Trim();
        var email = dto.Email?.Trim();
        var role = dto.Role?.Trim();

        if (string.IsNullOrWhiteSpace(fullName))
            return BadRequest(new { message = "Magaca user-ka waa qasab" });

        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { message = "Email-ka user-ka waa qasab" });

        if (role != "Admin" && role != "User")
            return BadRequest(new { message = "Role-ku waa inuu noqdaa Admin ama User" });

        var emailExists = await _context.Users
            .AnyAsync(item => item.Id != id && item.Email != null && item.Email.ToLower() == email.ToLower());

        if (emailExists)
            return BadRequest(new { message = "Email-kan user kale ayaa isticmaala" });

        if (user.Role == "Admin" && role != "Admin")
        {
            var adminCount = await _context.Users.CountAsync(item => item.Role == "Admin");
            if (adminCount <= 1)
                return BadRequest(new { message = "Admin-ka ugu dambeeya lama beddeli karo User" });
        }

        user.FullName = fullName;
        user.Email = email;
        user.Role = role;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.CreatedDate
        });
    }
}

public class UpdateUserDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
}

public class CreateUserDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; }
}
