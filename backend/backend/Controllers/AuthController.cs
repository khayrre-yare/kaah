using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await _authService.Login(dto);

        if (result == null)
            return Unauthorized(new { message = "Email ama password waa khalad" });

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var success = await _authService.Register(dto);

        if (!success)
            return BadRequest(new { message = "Email-kan horay ayaa loo diiwaangeliyay" });

        return Ok(new { message = "Isdiiwaangelinta waa guulaysatay" });
    }
}
