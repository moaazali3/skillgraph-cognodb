using Microsoft.AspNetCore.Mvc;
using SkillGraph.Api.Services;

namespace SkillGraph.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ICognoDBService _cognodbService;

    public HealthController(ICognoDBService cognodbService)
    {
        _cognodbService = cognodbService;
    }

    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        var (connected, message, latencyMs, uri) = await _cognodbService.CheckHealthAsync();
        return Ok(new
        {
            connected,
            message,
            latencyMs,
            uri
        });
    }
}

[ApiController]
[Route("api/[controller]")]
public class GraphController : ControllerBase
{
    private readonly ICognoDBService _cognodbService;

    public GraphController(ICognoDBService cognodbService)
    {
        _cognodbService = cognodbService;
    }

    [HttpGet]
    public async Task<IActionResult> GetGraph()
    {
        var data = await _cognodbService.GetGraphDataAsync();
        return Ok(data);
    }
}

[ApiController]
[Route("api/path")]
public class PathFinderController : ControllerBase
{
    private readonly ICognoDBService _cognodbService;

    public PathFinderController(ICognoDBService cognodbService)
    {
        _cognodbService = cognodbService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaths([FromQuery] string? start, [FromQuery] string target = "rag-arch")
    {
        var (paths, meta) = await _cognodbService.FindPrerequisitePathsAsync(start, target);
        return Ok(new { paths, meta });
    }
}

[ApiController]
[Route("api/skill-gap")]
public class SkillGapController : ControllerBase
{
    private readonly ICognoDBService _cognodbService;

    public SkillGapController(ICognoDBService cognodbService)
    {
        _cognodbService = cognodbService;
    }

    [HttpGet]
    public async Task<IActionResult> Analyze([FromQuery] string dev = "dev-sarah", [FromQuery] string role = "ai-systems-engineer")
    {
        var (analysis, meta) = await _cognodbService.AnalyzeSkillGapAsync(dev, role);
        return Ok(new { analysis, meta });
    }

    [HttpGet("roi")]
    public async Task<IActionResult> GetRoi([FromQuery] string dev = "dev-alex")
    {
        var (skills, meta) = await _cognodbService.GetHighestRoiSkillsAsync(dev);
        return Ok(new { skills, meta });
    }
}

[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    private readonly ICognoDBService _cognodbService;

    public RolesController(ICognoDBService cognodbService)
    {
        _cognodbService = cognodbService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _cognodbService.GetRolesAsync();
        return Ok(new { roles });
    }
}

[ApiController]
[Route("api/developers")]
public class DevelopersController : ControllerBase
{
    private readonly ICognoDBService _cognodbService;

    public DevelopersController(ICognoDBService cognodbService)
    {
        _cognodbService = cognodbService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDevelopers()
    {
        var developers = await _cognodbService.GetDevelopersAsync();
        return Ok(new { developers });
    }
}

