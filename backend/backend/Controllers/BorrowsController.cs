using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BorrowsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BorrowsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<BorrowDto>>> GetAll()
    {
        var query = _context.Borrows
            .Include(b => b.User)
            .Include(b => b.Book)
            .AsQueryable();

        if (!User.IsInRole("Admin"))
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            query = query.Where(b => b.UserId == userId);
        }

        var borrows = await query
            .Select(b => new BorrowDto
            {
                Id = b.Id,
                UserId = b.UserId,
                UserName = b.User != null ? b.User.FullName : null,
                BookId = b.BookId,
                BookTitle = b.Book != null ? b.Book.Title : null,
                BorrowDate = b.BorrowDate,
                ReturnDate = b.ReturnDate,
                Status = b.Status
            })
            .ToListAsync();

        return Ok(borrows);
    }

    [HttpPost]
    public async Task<ActionResult<BorrowDto>> Create(CreateBorrowDto dto)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var book = await _context.Books.FindAsync(dto.BookId);
        if (book == null)
            return NotFound(new { message = "Buugga lama helin" });

        if (book.Quantity <= 0)
            return BadRequest(new { message = "Buuggan ma jiraan tiro ku filan" });

        if (dto.ReturnDate <= DateTime.UtcNow)
            return BadRequest(new { message = "Taariikhda celinta waa in ay mustaqbalka tahay" });

        var borrow = new Borrow
        {
            UserId = userId,
            BookId = dto.BookId,
            BorrowDate = DateTime.UtcNow,
            ReturnDate = dto.ReturnDate.ToUniversalTime(),
            Status = "Pending"
        };

        _context.Borrows.Add(borrow);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        return Ok(new BorrowDto
        {
            Id = borrow.Id,
            UserId = borrow.UserId,
            UserName = user?.FullName,
            BookId = borrow.BookId,
            BookTitle = book.Title,
            BorrowDate = borrow.BorrowDate,
            ReturnDate = borrow.ReturnDate,
            Status = borrow.Status
        });
    }

    [HttpPut("{id}/return")]
    public async Task<IActionResult> ReturnBook(int id)
    {
        var borrow = await _context.Borrows
            .Include(b => b.Book)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (borrow == null)
            return NotFound(new { message = "Amaahda lama helin" });

        if (!User.IsInRole("Admin"))
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (borrow.UserId != userId)
                return Forbid();
        }

        if (borrow.Status == "Returned")
            return BadRequest(new { message = "Buuggan horay ayaa loo celiyay" });

        if (borrow.Status != "Approved" && borrow.Status != "Active")
            return BadRequest(new { message = "Buuggan wali lama fasixin ama waa la diiday" });

        borrow.Status = "Returned";
        if (borrow.Book != null)
            borrow.Book.Quantity++;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Buugga si guul leh ayaa loo celiyay" });
    }

    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveBorrow(int id)
    {
        var borrow = await _context.Borrows
            .Include(b => b.Book)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (borrow == null)
            return NotFound(new { message = "Amaahda lama helin" });

        if (borrow.Status == "Approved" || borrow.Status == "Active")
            return BadRequest(new { message = "Amaahdan horay ayaa loo fasaxay" });

        if (borrow.Status == "Returned")
            return BadRequest(new { message = "Amaahdan horay ayaa loo celiyay" });

        if (borrow.Status == "Rejected")
            return BadRequest(new { message = "Amaahdan horay ayaa loo diiday" });

        if (borrow.Book == null || borrow.Book.Quantity <= 0)
            return BadRequest(new { message = "Buuggan tiro ku filan ma laha" });

        borrow.Book.Quantity--;
        borrow.Status = "Approved";

        await _context.SaveChangesAsync();
        return Ok(new { message = "Amaahda waa la fasaxay" });
    }

    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectBorrow(int id)
    {
        var borrow = await _context.Borrows.FindAsync(id);

        if (borrow == null)
            return NotFound(new { message = "Amaahda lama helin" });

        if (borrow.Status != "Pending")
            return BadRequest(new { message = "Kaliya request Pending ah ayaa la diidi karaa" });

        borrow.Status = "Rejected";

        await _context.SaveChangesAsync();
        return Ok(new { message = "Amaahda waa la diiday" });
    }
}
