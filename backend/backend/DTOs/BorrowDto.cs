namespace backend.DTOs;

public class BorrowDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public int BookId { get; set; }
    public string? BookTitle { get; set; }
    public DateTime BorrowDate { get; set; }
    public DateTime ReturnDate { get; set; }
    public string Status { get; set; } = "Pending";
}

public class CreateBorrowDto
{
    public int BookId { get; set; }
    public DateTime ReturnDate { get; set; }
}
