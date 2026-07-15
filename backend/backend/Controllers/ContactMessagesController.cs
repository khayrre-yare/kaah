using System.Security.Claims;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ContactMessagesController : ControllerBase
{
    private const string PendingStatus = "Weli lama jawaabin";
    private const string RepliedStatus = "Waa laga jawaabay";
    private readonly AppDbContext _context;

    public ContactMessagesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<ContactMessageDto>>> GetAll()
    {
        var query = _context.ContactMessages
            .Include(message => message.User)
            .AsQueryable();

        if (!User.IsInRole("Admin"))
        {
            var userId = GetUserId();
            query = query.Where(message => message.UserId == userId);
        }

        var messages = await query
            .OrderByDescending(message => message.CreatedAt)
            .Select(message => new ContactMessageDto
            {
                MessageId = message.MessageId,
                UserId = message.UserId,
                UserName = message.User != null ? message.User.FullName : null,
                UserEmail = message.User != null ? message.User.Email : null,
                Message = message.Message,
                AdminReply = message.AdminReply,
                Status = message.Status,
                CreatedAt = message.CreatedAt,
                RepliedAt = message.RepliedAt
            })
            .ToListAsync();

        return Ok(messages);
    }

    [HttpPost]
    public async Task<ActionResult<ContactMessageDto>> Create(CreateContactMessageDto dto)
    {
        var userId = GetUserId();
        var text = (dto.Message ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(text))
            return BadRequest(new { message = "Fariinta waa qasab." });

        var hasExistingMessage = await _context.ContactMessages
            .AnyAsync(message => message.UserId == userId);

        if (hasExistingMessage)
            return BadRequest(new { message = "Waxaad hore u dirtay fariin. Qaybtan waxay leedahay hal fariin iyo hal jawaab." });

        var contactMessage = new ContactMessage
        {
            UserId = userId,
            Message = text,
            Status = PendingStatus,
            CreatedAt = DateTime.UtcNow
        };

        _context.ContactMessages.Add(contactMessage);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        return Ok(new ContactMessageDto
        {
            MessageId = contactMessage.MessageId,
            UserId = contactMessage.UserId,
            UserName = user?.FullName,
            UserEmail = user?.Email,
            Message = contactMessage.Message,
            AdminReply = contactMessage.AdminReply,
            Status = contactMessage.Status,
            CreatedAt = contactMessage.CreatedAt,
            RepliedAt = contactMessage.RepliedAt
        });
    }

    [HttpPut("{id}/reply")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reply(int id, ReplyContactMessageDto dto)
    {
        var reply = (dto.AdminReply ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(reply))
            return BadRequest(new { message = "Jawaabta maamulka waa qasab." });

        var contactMessage = await _context.ContactMessages.FindAsync(id);

        if (contactMessage == null)
            return NotFound(new { message = "Fariinta lama helin." });

        contactMessage.AdminReply = reply;
        contactMessage.Status = RepliedStatus;
        contactMessage.RepliedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Jawaabta waa la diray." });
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}

public class CreateContactMessageDto
{
    public string? Message { get; set; }
}

public class ReplyContactMessageDto
{
    public string? AdminReply { get; set; }
}

public class ContactMessageDto
{
    public int MessageId { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AdminReply { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? RepliedAt { get; set; }
}
