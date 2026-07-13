using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly AppDbContext _context;

    public BooksController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<BookDto>>> GetAll()
    {
        var books = await _context.Books
            .Include(b => b.Category)
            .Select(b => new BookDto
            {
                Id = b.Id,
                Title = b.Title,
                Author = b.Author,
                Price = b.Price,
                Quantity = b.Quantity,
                CategoryId = b.CategoryId,
                CategoryName = b.Category != null ? b.Category.Name : null
            })
            .ToListAsync();

        return Ok(books);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BookDto>> GetById(int id)
    {
        var book = await _context.Books
            .Include(b => b.Category)
            .Where(b => b.Id == id)
            .Select(b => new BookDto
            {
                Id = b.Id,
                Title = b.Title,
                Author = b.Author,
                Price = b.Price,
                Quantity = b.Quantity,
                CategoryId = b.CategoryId,
                CategoryName = b.Category != null ? b.Category.Name : null
            })
            .FirstOrDefaultAsync();

        if (book == null)
            return NotFound(new { message = "Buugga lama helin" });

        return Ok(book);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<BookDto>> Create(CreateBookDto dto)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "Category-ga lama helin" });

        var book = new Book
        {
            Title = dto.Title,
            Author = dto.Author,
            Price = dto.Price,
            Quantity = dto.Quantity,
            CategoryId = dto.CategoryId
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        var category = await _context.Categories.FindAsync(book.CategoryId);

        return CreatedAtAction(nameof(GetById), new { id = book.Id }, new BookDto
        {
            Id = book.Id,
            Title = book.Title,
            Author = book.Author,
            Price = book.Price,
            Quantity = book.Quantity,
            CategoryId = book.CategoryId,
            CategoryName = category?.Name
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateBookDto dto)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
            return NotFound(new { message = "Buugga lama helin" });

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId);
        if (!categoryExists)
            return BadRequest(new { message = "Category-ga lama helin" });

        book.Title = dto.Title;
        book.Author = dto.Author;
        book.Price = dto.Price;
        book.Quantity = dto.Quantity;
        book.CategoryId = dto.CategoryId;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
            return NotFound(new { message = "Buugga lama helin" });

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
