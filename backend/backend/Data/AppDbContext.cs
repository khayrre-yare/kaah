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

public DbSet<ContactMessage> ContactMessages {get;set;}


protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    modelBuilder.Entity<Users>(entity =>
    {
        entity.Property(user => user.FullName).IsRequired(false);
        entity.Property(user => user.Email).IsRequired(false);
        entity.Property(user => user.PasswordHash).IsRequired(false);
        entity.Property(user => user.Role).IsRequired(false);
    });

    modelBuilder.Entity<ContactMessage>(entity =>
    {
        entity.ToTable("contact_messages");
        entity.HasKey(message => message.MessageId);
        entity.Property(message => message.MessageId).HasColumnName("message_id");
        entity.Property(message => message.UserId).HasColumnName("user_id");
        entity.Property(message => message.Message).HasColumnName("message").IsRequired();
        entity.Property(message => message.AdminReply).HasColumnName("admin_reply");
        entity.Property(message => message.Status).HasColumnName("status").IsRequired();
        entity.Property(message => message.CreatedAt).HasColumnName("created_at");
        entity.Property(message => message.RepliedAt).HasColumnName("replied_at");
        entity.HasOne(message => message.User)
            .WithMany()
            .HasForeignKey(message => message.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    });
}

}
