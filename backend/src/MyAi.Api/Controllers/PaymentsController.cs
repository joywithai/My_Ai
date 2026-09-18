using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MyAi.Application.DTOs;
using MyAi.Application.Interfaces;
using MyAi.Application.Services;
using MyAi.Api.Extensions;

namespace MyAi.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/payments")]
public class PaymentsController : ControllerBase
{
    private readonly PaymentService _payments;
    private readonly IAppDbContext _db;

    public PaymentsController(PaymentService payments, IAppDbContext db)
    {
        _payments = payments;
        _db = db;
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(CheckoutRequest req)
    {
        var user = _db.Users.First(u => u.Id == User.UserId());
        var payment = await _payments.CheckoutAsync(user, req.PlanId);
        return Ok(new { ok = true, payment = new { id = payment.Id, amount = payment.Amount, status = payment.Status }, role = user.Role });
    }
}
