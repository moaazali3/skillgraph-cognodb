using Microsoft.AspNetCore.Mvc;
using Neo4j.Driver;
using SkillGraph.Api.Data;

namespace SkillGraph.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly IDriver _driver;
    private readonly ILogger<SeedController> _logger;

    public SeedController(IDriver driver, ILogger<SeedController> logger)
    {
        _driver = driver;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> SeedDatabase()
    {
        try
        {
            await DatabaseSeeder.SeedAsync(_driver);
            return Ok(new { success = true, message = "CognoDB database seeded successfully with nodes and relationships." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database seeding failed.");
            return StatusCode(500, new { success = false, error = ex.Message });
        }
    }
}
