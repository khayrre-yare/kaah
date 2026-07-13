using Microsoft.EntityFrameworkCore;
using backend.Models;


namespace backend.Data;


public class AppDbContext:DbContext
{

public AppDbContext(DbContextOptions options)
:base(options)
{

}



public DbSet<Users> Users {get;set;}

public DbSet<Book> Books {get;set;}

public DbSet<Category> Categories {get;set;}

public DbSet<Borrow> Borrows {get;set;}

public DbSet<Order> Orders {get;set;}

public DbSet<OrderDetail> OrderDetails {get;set;}


protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Users>(entity =>
    {
        entity.Property(user => user.FullName).IsRequired(false);
        entity.Property(user => user.Email).IsRequired(false);
        entity.Property(user => user.PasswordHash).IsRequired(false);
        entity.Property(user => user.Role).IsRequired(false);
    });
}

}
