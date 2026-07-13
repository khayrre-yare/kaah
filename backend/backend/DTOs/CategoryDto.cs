namespace backend.DTOs;

public class CategoryDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
}

public class CreateCategoryDto
{
    public string? Name { get; set; }
}
