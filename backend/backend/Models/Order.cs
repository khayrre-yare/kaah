using Microsoft.EntityFrameworkCore;
namespace backend.Models;


public class Order
{

    public int Id {get;set;}


    public int UserId {get;set;}

    public Users? User {get;set;}



    public DateTime OrderDate {get;set;}=DateTime.Now;


    public decimal Total {get;set;}

    public string Status { get; set; } = "Pending";



    public List<OrderDetail>? Details {get;set;}

}
