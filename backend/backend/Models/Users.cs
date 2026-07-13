namespace backend.Models;

public class Users
{
    public int Id { get; set; }

    public string? FullName { get; set; }

    public string? Email { get; set; }

    public string? PasswordHash { get; set; }

    public string? Role { get; set; }

    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    public List<Borrow>? Borrows { get; set; }

    public List<Order>? Orders { get; set; }
}
