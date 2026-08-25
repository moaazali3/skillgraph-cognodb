namespace SkillGraph.Api.Models;

public record SkillNode(
    string Id,
    string Name,
    string Category,
    string Difficulty,
    int MarketDemand,
    string Description,
    string IconName
);

public record RoleNode(
    string Id,
    string Title,
    string Domain,
    string SeniorityLevel,
    string AvgSalary,
    string Description,
    string IconName
);

public record DeveloperNode(
    string Id,
    string Name,
    string Title,
    int ExperienceYears,
    string Avatar,
    string Bio,
    string? TargetRoleId = null
);

public record CourseNode(
    string Id,
    string Title,
    string Platform,
    string Url,
    int DurationHours,
    double Rating
);

public record ProjectNode(
    string Id,
    string Name,
    string Difficulty,
    string Description
);

public record GraphNodeDto(
    string Id,
    string Label,
    string Type,
    string? Category,
    string? Difficulty,
    int? MarketDemand,
    string? Domain,
    string? Avatar,
    int Val
);

public record GraphLinkDto(
    string Source,
    string Target,
    string Type,
    string? Importance = null,
    string? MinLevel = null,
    string? Level = null,
    int? Weight = null
);

public record GraphDataResponse(
    List<GraphNodeDto> Nodes,
    List<GraphLinkDto> Links,
    object Stats,
    QueryMetadata Meta
);

public record QueryMetadata(
    long ExecutionTimeMs,
    string Source,
    string Cypher,
    object? Params = null,
    string? Error = null
);

public record PathStepDto(
    string Id,
    string Name,
    string? Category,
    string? Difficulty
);

public record PathResultDto(
    List<PathStepDto> PathNodes,
    int Hops
);

public record SkillGapItemDto(
    string SkillId,
    string SkillName,
    string Category,
    string Difficulty,
    int MarketDemand,
    string Description,
    string RequiredLevel,
    int Weight,
    string? CurrentLevel,
    bool IsAcquired,
    int ReadinessBonus,
    List<object> Courses,
    List<object> Projects
);

public record RoiSkillDto(
    string SkillId,
    string SkillName,
    string Category,
    int MarketDemand,
    int UnlockedRolesCount,
    List<string> UnlockedRoles
);

public record SalaryTierDto(
    string Level,
    string SalaryRange,
    string ExperienceYears
);

public record RoleDetailDto(
    string Id,
    string Title,
    string Domain,
    string SeniorityLevel,
    string BaseSalary,
    string Description,
    string IconName,
    string MarketGrowth,
    int OpenPositions,
    List<SalaryTierDto> SalaryTiers,
    List<string> RequiredSkills
);

public record DeveloperProfileDto(
    string Id,
    string Name,
    string Title,
    int ExperienceYears,
    string Avatar,
    string Bio,
    List<string> VerifiedSkills
);
