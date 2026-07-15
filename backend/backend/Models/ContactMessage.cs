namespace backend.Models;

public class ContactMessage
{
    public int MessageId { get; set; }
    public int UserId { get; set; }
    public Users? User { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AdminReply { get; set; }
    public string Status { get; set; } = "Weli lama jawaabin";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RepliedAt { get; set; }
}
