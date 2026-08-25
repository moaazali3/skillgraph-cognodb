using SkillGraph.Api.Models;

namespace SkillGraph.Api.Services;

public interface ICognoDBService
{
    Task<(bool Connected, string Message, long LatencyMs, string? Uri)> CheckHealthAsync();
    Task<GraphDataResponse> GetGraphDataAsync();
    Task<(List<PathResultDto> Paths, QueryMetadata Meta)> FindPrerequisitePathsAsync(string? startSkillId, string targetSkillId);
    Task<(List<SkillGapItemDto> Analysis, QueryMetadata Meta)> AnalyzeSkillGapAsync(string devId, string roleId);
    Task<(List<RoiSkillDto> Skills, QueryMetadata Meta)> GetHighestRoiSkillsAsync(string devId);
    Task<List<RoleDetailDto>> GetRolesAsync();
    Task<List<DeveloperProfileDto>> GetDevelopersAsync();
}
