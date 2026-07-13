using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;



namespace backend.Services;


public class AuthService
{

    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;


    public AuthService(
        AppDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }



    public async Task<LoginResponseDto?> Login(LoginDto dto)
    {

        var users = await _context.Users
            .FirstOrDefaultAsync(x =>
            x.Email == dto.Email &&
            x.PasswordHash == dto.Password);



        if(users == null)
            return null;



        var token = GenerateToken(users);



        return new LoginResponseDto
        {
            Token = token,
            Role = users.Role,
            Name = users.FullName
        };

    }





    public async Task<bool> Register(RegisterDto dto)
    {


        var exists = await _context.Users
        .AnyAsync(x=>x.Email==dto.Email);



        if(exists)
            return false;



        var user = new Users
        {
            FullName = dto.FullName ?? string.Empty,
            Email = dto.Email ?? string.Empty,
            PasswordHash = dto.Password ?? string.Empty,
            Role = "User"
        };



        _context.Users.Add(user);


        await _context.SaveChangesAsync();



        return true;

    }





    private string GenerateToken(Users users)
    {

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, users.Id.ToString()),
            new Claim(ClaimTypes.Name, users.FullName ?? "User"),
            new Claim(ClaimTypes.Email, users.Email ?? string.Empty),
            new Claim(ClaimTypes.Role, users.Role ?? "User")
        };



        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
            _configuration["Jwt:Key"]
            )
        );



        var credentials =
        new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );



        var token =
        new JwtSecurityToken(
            claims:claims,
            expires:DateTime.Now.AddHours(2),
            signingCredentials:credentials
        );



        return new JwtSecurityTokenHandler()
        .WriteToken(token);

    }


}
