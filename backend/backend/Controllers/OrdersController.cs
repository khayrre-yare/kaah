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
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetAll()
    {
        var query = _context.Orders
            .Include(o => o.User)
            .Include(o => o.Details!)
                .ThenInclude(d => d.Book)
            .AsQueryable();

        if (!User.IsInRole("Admin"))
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            query = query.Where(o => o.UserId == userId);
        }

        var orders = await query
            .Select(o => new OrderDto
            {
                Id = o.Id,
                UserId = o.UserId,
                UserName = o.User != null ? o.User.FullName : null,
                OrderDate = o.OrderDate,
                Total = o.Total,
                Status = o.Status,
                Details = o.Details!.Select(d => new OrderDetailDto
                {
                    Id = d.Id,
                    BookId = d.BookId,
                    BookTitle = d.Book != null ? d.Book.Title : null,
                    Quantity = d.Quantity,
                    Price = d.Price
                }).ToList()
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetById(int id)
    {
        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.Details!)
                .ThenInclude(d => d.Book)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound(new { message = "Dalabka lama helin" });

        if (!User.IsInRole("Admin"))
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (order.UserId != userId)
                return Forbid();
        }

        return Ok(new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            UserName = order.User?.FullName,
            OrderDate = order.OrderDate,
            Total = order.Total,
            Status = order.Status,
            Details = order.Details?.Select(d => new OrderDetailDto
            {
                Id = d.Id,
                BookId = d.BookId,
                BookTitle = d.Book?.Title,
                Quantity = d.Quantity,
                Price = d.Price
            }).ToList()
        });
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
            return BadRequest(new { message = "Ugu yaraan hal buug ayaa loo baahan yahay" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var bookIds = dto.Items.Select(i => i.BookId).Distinct().ToList();

        var books = await _context.Books
            .Where(b => bookIds.Contains(b.Id))
            .ToListAsync();

        if (books.Count != bookIds.Count)
            return BadRequest(new { message = "Buug qaarkood lama helin" });

        decimal total = 0;
        var details = new List<OrderDetail>();

        foreach (var item in dto.Items)
        {
            var book = books.First(b => b.Id == item.BookId);

            if (item.Quantity <= 0)
                return BadRequest(new { message = "Tirada waa in ay ka weyn tahay eber" });

            total += book.Price * item.Quantity;
            details.Add(new OrderDetail
            {
                BookId = book.Id,
                Quantity = item.Quantity,
                Price = book.Price
            });
        }

        var order = new Order
        {
            UserId = userId,
            OrderDate = DateTime.UtcNow,
            Total = total,
            Status = "Pending",
            Details = details
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        return Ok(new OrderDto
        {
            Id = order.Id,
            UserId = order.UserId,
            UserName = user?.FullName,
            OrderDate = order.OrderDate,
            Total = order.Total,
            Status = order.Status,
            Details = details.Select(d =>
            {
                var book = books.First(b => b.Id == d.BookId);
                return new OrderDetailDto
                {
                    Id = d.Id,
                    BookId = d.BookId,
                    BookTitle = book.Title,
                    Quantity = d.Quantity,
                    Price = d.Price
                };
            }).ToList()
        });
    }

    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveOrder(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Details!)
                .ThenInclude(d => d.Book)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound(new { message = "Dalabka lama helin" });

        if (order.Status == "Approved")
            return BadRequest(new { message = "Dalabkan horay ayaa loo fasaxay" });

        if (order.Status == "Rejected")
            return BadRequest(new { message = "Dalabkan horay ayaa loo diiday" });

        if (order.Details == null || order.Details.Count == 0)
            return BadRequest(new { message = "Dalabkan wax buugaag ah kuma jiraan" });

        foreach (var detail in order.Details)
        {
            if (detail.Book == null)
                return BadRequest(new { message = "Buug ka mid ah dalabka lama helin" });

            if (detail.Book.Quantity < detail.Quantity)
                return BadRequest(new { message = $"Buuggan '{detail.Book.Title}' tiro ku filan ma laha" });
        }

        foreach (var detail in order.Details)
        {
            detail.Book!.Quantity -= detail.Quantity;
        }

        order.Status = "Approved";

        await _context.SaveChangesAsync();
        return Ok(new { message = "Dalabka waa la fasaxay" });
    }

    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RejectOrder(int id)
    {
        var order = await _context.Orders.FindAsync(id);

        if (order == null)
            return NotFound(new { message = "Dalabka lama helin" });

        if (order.Status != "Pending")
            return BadRequest(new { message = "Kaliya dalab Pending ah ayaa la diidi karaa" });

        order.Status = "Rejected";

        await _context.SaveChangesAsync();
        return Ok(new { message = "Dalabka waa la diiday" });
    }
}
