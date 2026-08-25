using System.Diagnostics;
using Neo4j.Driver;
using SkillGraph.Api.Models;

namespace SkillGraph.Api.Services;

public class CognoDBService : ICognoDBService
{
    private readonly IDriver _driver;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CognoDBService> _logger;

    public CognoDBService(IDriver driver, IConfiguration configuration, ILogger<CognoDBService> logger)
    {
        _driver = driver;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<(bool Connected, string Message, long LatencyMs, string? Uri)> CheckHealthAsync()
    {
        var uri = _configuration["CognoDB:Uri"];
        var sw = Stopwatch.StartNew();

        try
        {
            await using var session = _driver.AsyncSession();
            var cursor = await session.RunAsync("RETURN 'Connected' AS status, timestamp() AS ts");
            await cursor.FetchAsync();
            sw.Stop();

            return (true, "Successfully connected to CognoDB Cloud over Bolt protocol.", sw.ElapsedMilliseconds, uri);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "CognoDB health check failed.");
            return (false, $"Connection failed: {ex.Message}", sw.ElapsedMilliseconds, uri);
        }
    }

    public async Task<GraphDataResponse> GetGraphDataAsync()
    {
        var cypher = @"
            MATCH (n)
            OPTIONAL MATCH (n)-[r]->(m)
            RETURN 
              collect(DISTINCT {
                id: coalesce(n.id, id(n)),
                label: coalesce(n.name, n.title),
                type: labels(n)[0],
                category: n.category,
                difficulty: n.difficulty,
                marketDemand: n.marketDemand,
                domain: n.domain,
                avatar: n.avatar,
                val: CASE 
                  WHEN labels(n)[0] = 'Role' THEN 22
                  WHEN labels(n)[0] = 'Developer' THEN 18
                  WHEN labels(n)[0] = 'Skill' THEN 14
                  WHEN labels(n)[0] = 'Course' THEN 10
                  ELSE 8
                END
              }) AS nodes,
              collect(DISTINCT CASE WHEN r IS NOT NULL THEN {
                source: coalesce(startNode(r).id, id(startNode(r))),
                target: coalesce(endNode(r).id, id(endNode(r))),
                type: type(r),
                importance: r.importance,
                minLevel: r.minLevel,
                level: r.level,
                weight: r.weight
              } ELSE null END) AS links
        ";

        var sw = Stopwatch.StartNew();
        var nodes = new List<GraphNodeDto>();
        var links = new List<GraphLinkDto>();

        try
        {
            await using var session = _driver.AsyncSession();
            var cursor = await session.RunAsync(cypher);
            if (await cursor.FetchAsync())
            {
                var record = cursor.Current;
                var rawNodes = record["nodes"].As<List<object>>();
                var rawLinks = record["links"].As<List<object>>();

                foreach (var item in rawNodes)
                {
                    if (item is Dictionary<string, object> dict)
                    {
                        nodes.Add(new GraphNodeDto(
                            dict["id"]?.ToString() ?? "",
                            dict["label"]?.ToString() ?? "",
                            dict["type"]?.ToString() ?? "Node",
                            dict.TryGetValue("category", out var c) ? c?.ToString() : null,
                            dict.TryGetValue("difficulty", out var diff) ? diff?.ToString() : null,
                            dict.TryGetValue("marketDemand", out var md) && md != null ? Convert.ToInt32(md) : null,
                            dict.TryGetValue("domain", out var dom) ? dom?.ToString() : null,
                            dict.TryGetValue("avatar", out var av) ? av?.ToString() : null,
                            dict.TryGetValue("val", out var v) && v != null ? Convert.ToInt32(v) : 12
                        ));
                    }
                }

                foreach (var item in rawLinks)
                {
                    if (item is Dictionary<string, object> dict && dict != null)
                    {
                        var source = dict.TryGetValue("source", out var s) ? s?.ToString() ?? "" : "";
                        var target = dict.TryGetValue("target", out var t) ? t?.ToString() ?? "" : "";
                        if (!string.IsNullOrEmpty(source) && !string.IsNullOrEmpty(target))
                        {
                            links.Add(new GraphLinkDto(
                                source,
                                target,
                                dict.TryGetValue("type", out var type) ? type?.ToString() ?? "" : "",
                                dict.TryGetValue("importance", out var imp) ? imp?.ToString() : null,
                                dict.TryGetValue("minLevel", out var ml) ? ml?.ToString() : null,
                                dict.TryGetValue("level", out var lvl) ? lvl?.ToString() : null,
                                dict.TryGetValue("weight", out var w) && w != null ? Convert.ToInt32(w) : null
                            ));
                        }
                    }
                }
            }

            sw.Stop();
            var meta = new QueryMetadata(sw.ElapsedMilliseconds, "CognoDB Cloud (Bolt 5.x)", cypher);
            var stats = new { nodeCount = nodes.Count, linkCount = links.Count };
            return new GraphDataResponse(nodes, links, stats, meta);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "GetGraphDataAsync failed");
            var meta = new QueryMetadata(sw.ElapsedMilliseconds, "CognoDB Cloud (Bolt 5.x)", cypher, null, ex.Message);
            return new GraphDataResponse(nodes, links, new { }, meta);
        }
    }

    public async Task<(List<PathResultDto> Paths, QueryMetadata Meta)> FindPrerequisitePathsAsync(string? startSkillId, string targetSkillId)
    {
        var isSpecificStart = !string.IsNullOrEmpty(startSkillId);
        var cypher = isSpecificStart
            ? @"
                MATCH path = (start:Skill {id: $startSkillId})-[:PREREQUISITE_FOR*1..5]->(target:Skill {id: $targetSkillId})
                RETURN 
                  [n IN nodes(path) | { id: n.id, name: n.name, category: n.category, difficulty: n.difficulty }] AS pathNodes,
                  length(path) AS hops
                ORDER BY hops ASC
            "
            : @"
                MATCH path = (prereq:Skill)-[:PREREQUISITE_FOR*1..5]->(target:Skill {id: $targetSkillId})
                RETURN 
                  [n IN nodes(path) | { id: n.id, name: n.name, category: n.category, difficulty: n.difficulty }] AS pathNodes,
                  length(path) AS hops
                ORDER BY hops DESC
            ";

        var parameters = new Dictionary<string, object>
        {
            { "targetSkillId", targetSkillId }
        };
        if (isSpecificStart) parameters["startSkillId"] = startSkillId!;

        var sw = Stopwatch.StartNew();
        var paths = new List<PathResultDto>();

        try
        {
            await using var session = _driver.AsyncSession();
            var cursor = await session.RunAsync(cypher, parameters);

            while (await cursor.FetchAsync())
            {
                var record = cursor.Current;
                var rawNodes = record["pathNodes"].As<List<object>>();
                var hops = Convert.ToInt32(record["hops"]);

                var stepList = new List<PathStepDto>();
                foreach (var n in rawNodes)
                {
                    if (n is Dictionary<string, object> dict)
                    {
                        stepList.Add(new PathStepDto(
                            dict["id"]?.ToString() ?? "",
                            dict["name"]?.ToString() ?? "",
                            dict.TryGetValue("category", out var cat) ? cat?.ToString() : null,
                            dict.TryGetValue("difficulty", out var diff) ? diff?.ToString() : null
                        ));
                    }
                }

                paths.Add(new PathResultDto(stepList, hops));
            }

            sw.Stop();
            var meta = new QueryMetadata(sw.ElapsedMilliseconds, "CognoDB Cloud (openCypher)", cypher, parameters);
            return (paths, meta);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "FindPrerequisitePathsAsync failed");
            var meta = new QueryMetadata(sw.ElapsedMilliseconds, "CognoDB Cloud (openCypher)", cypher, parameters, ex.Message);
            return (paths, meta);
        }
    }

    public async Task<(List<SkillGapItemDto> Analysis, QueryMetadata Meta)> AnalyzeSkillGapAsync(string devId, string roleId)
    {
        var cypher = @"
            MATCH (r:Role {id: $roleId})-[:REQUIRES_SKILL]->(needed:Skill)
            OPTIONAL MATCH (d:Developer {id: $devId})-[prof:PROFICIENT_IN]->(needed)
            OPTIONAL MATCH (d)-[:PROFICIENT_IN]->(owned:Skill)-[:PREREQUISITE_FOR*1..3]->(needed)
            RETURN 
              needed.id AS skillId,
              needed.name AS skillName,
              needed.category AS category,
              needed.difficulty AS difficulty,
              needed.marketDemand AS marketDemand,
              needed.description AS description,
              prof.level AS currentLevel,
              prof IS NOT NULL AS isAcquired,
              count(DISTINCT owned) AS readinessBonus
            ORDER BY isAcquired ASC, needed.name ASC
        ";

        var parameters = new Dictionary<string, object>
        {
            { "devId", devId },
            { "roleId", roleId }
        };

        var sw = Stopwatch.StartNew();
        var results = new List<SkillGapItemDto>();

        try
        {
            await using var session = _driver.AsyncSession();
            var cursor = await session.RunAsync(cypher, parameters);

            while (await cursor.FetchAsync())
            {
                var record = cursor.Current;
                var skillId = record.Values.TryGetValue("skillId", out var sId) ? sId?.ToString() ?? "" : "";
                var skillName = record.Values.TryGetValue("skillName", out var sNm) ? sNm?.ToString() ?? "" : "";
                var category = record.Values.TryGetValue("category", out var cat) ? cat?.ToString() ?? "General" : "General";
                var difficulty = record.Values.TryGetValue("difficulty", out var diff) ? diff?.ToString() ?? "Intermediate" : "Intermediate";
                var marketDemand = record.Values.TryGetValue("marketDemand", out var mdVal) && mdVal != null ? Convert.ToInt32(mdVal) : 85;
                var description = record.Values.TryGetValue("description", out var desc) ? desc?.ToString() ?? "" : "";
                var requiredLevel = record.Values.TryGetValue("requiredLevel", out var rl) ? rl?.ToString() ?? "Intermediate" : "Intermediate";
                var weight = record.Values.TryGetValue("weight", out var wVal) && wVal != null ? Convert.ToInt32(wVal) : 3;
                var currentLevel = record.Values.TryGetValue("currentLevel", out var clVal) ? clVal?.ToString() : null;
                var isAcquired = record.Values.TryGetValue("isAcquired", out var acqVal) && acqVal != null && Convert.ToBoolean(acqVal);
                var readinessBonus = record.Values.TryGetValue("readinessBonus", out var rbVal) && rbVal != null ? Convert.ToInt32(rbVal) : 0;

                results.Add(new SkillGapItemDto(
                    skillId,
                    skillName,
                    category,
                    difficulty,
                    marketDemand,
                    description,
                    requiredLevel,
                    weight,
                    currentLevel,
                    isAcquired,
                    readinessBonus,
                    new List<object>(),
                    new List<object>()
                ));
            }

            sw.Stop();
            var meta = new QueryMetadata(sw.ElapsedMilliseconds, "CognoDB Cloud (openCypher)", cypher, parameters);
            return (results, meta);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "AnalyzeSkillGapAsync failed");
            var meta = new QueryMetadata(sw.ElapsedMilliseconds, "CognoDB Cloud (openCypher)", cypher, parameters, ex.Message);
            return (results, meta);
        }
    }

    public async Task<(List<RoiSkillDto> Skills, QueryMetadata Meta)> GetHighestRoiSkillsAsync(string devId)
    {
        var cypher = @"
            MATCH (d:Developer {id: $devId})
            MATCH (potential:Skill)
            WHERE NOT (d)-[:PROFICIENT_IN]->(potential)
            MATCH (r:Role)-[:REQUIRES_SKILL]->(potential)
            RETURN 
              potential.id AS skillId,
              potential.name AS skillName,
              potential.category AS category,
              potential.marketDemand AS marketDemand,
              count(DISTINCT r) AS unlockedRolesCount,
              collect(DISTINCT r.title) AS unlockedRoles
            ORDER BY unlockedRolesCount DESC, marketDemand DESC
            LIMIT 5
        ";

        var parameters = new Dictionary<string, object> { { "devId", devId } };
        var sw = Stopwatch.StartNew();
        var list = new List<RoiSkillDto>();

        try
        {
            await using var session = _driver.AsyncSession();
            var cursor = await session.RunAsync(cypher, parameters);

            while (await cursor.FetchAsync())
            {
                var record = cursor.Current;
                var skillId = record["skillId"]?.ToString() ?? "";
                var skillName = record["skillName"]?.ToString() ?? "";
                var category = record["category"]?.ToString() ?? "";
                var marketDemand = record.Values.TryGetValue("marketDemand", out var mdVal) && mdVal != null ? Convert.ToInt32(mdVal) : 85;
                var unlockedRolesCount = record.Values.TryGetValue("unlockedRolesCount", out var urVal) && urVal != null ? Convert.ToInt32(urVal) : 0;
                
                var rolesList = new List<string>();
                if (record.Values.TryGetValue("unlockedRoles", out var rawRoles) && rawRoles is IEnumerable<object> enumerable)
                {
                    foreach (var r in enumerable)
                    {
                        if (r != null) rolesList.Add(r.ToString()!);
                    }
                }

                list.Add(new RoiSkillDto(
                    skillId,
                    skillName,
                    category,
                    marketDemand,
                    unlockedRolesCount,
                    rolesList
                ));
            }

            sw.Stop();
            var meta = new QueryMetadata(sw.ElapsedMilliseconds, "CognoDB Cloud (openCypher)", cypher, parameters);
            return (list, meta);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "GetHighestRoiSkillsAsync failed");
            var meta = new QueryMetadata(sw.ElapsedMilliseconds, "CognoDB Cloud (openCypher)", cypher, parameters, ex.Message);
            return (list, meta);
        }
    }

    public async Task<List<RoleDetailDto>> GetRolesAsync()
    {
        var cypher = @"
            MATCH (r:Role)
            OPTIONAL MATCH (r)-[:REQUIRES_SKILL]->(s:Skill)
            RETURN 
              r.id AS id,
              r.title AS title,
              r.domain AS domain,
              r.seniorityLevel AS seniorityLevel,
              r.avgSalary AS avgSalary,
              r.description AS description,
              r.iconName AS iconName,
              collect(s.name) AS requiredSkills
            ORDER BY r.title
        ";

        var roles = new List<RoleDetailDto>();
        try
        {
            await using var session = _driver.AsyncSession();
            var cursor = await session.RunAsync(cypher);

            while (await cursor.FetchAsync())
            {
                var record = cursor.Current;
                var id = record["id"]?.ToString() ?? "";
                var title = record["title"]?.ToString() ?? "";
                var domain = record["domain"]?.ToString() ?? "";
                var seniorityLevel = record["seniorityLevel"]?.ToString() ?? "Senior";
                var avgSalary = record["avgSalary"]?.ToString() ?? "$150k - $200k";
                var description = record["description"]?.ToString() ?? "";
                var iconName = record["iconName"]?.ToString() ?? "Code";

                var skillsList = new List<string>();
                if (record.Values.TryGetValue("requiredSkills", out var rawSkills) && rawSkills is IEnumerable<object> enumSkills)
                {
                    foreach (var s in enumSkills)
                    {
                        if (s != null) skillsList.Add(s.ToString()!);
                    }
                }

                var salaryTiers = new List<SalaryTierDto>
                {
                    new("Junior Engineer", "$85,000 - $110,000 / yr", "1 - 2 Yrs Exp"),
                    new("Mid-Level Engineer", "$120,000 - $150,000 / yr", "3 - 5 Yrs Exp"),
                    new("Senior / Lead Architect", avgSalary + " / yr", "5+ Yrs Exp")
                };

                roles.Add(new RoleDetailDto(
                    id,
                    title,
                    domain,
                    seniorityLevel,
                    avgSalary,
                    description,
                    iconName,
                    "+32% YoY Growth",
                    1420,
                    salaryTiers,
                    skillsList
                ));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetRolesAsync failed");
        }

        return roles;
    }

    public async Task<List<DeveloperProfileDto>> GetDevelopersAsync()
    {
        var cypher = @"
            MATCH (d:Developer)
            OPTIONAL MATCH (d)-[:PROFICIENT_IN]->(s:Skill)
            RETURN 
              d.id AS id,
              d.name AS name,
              d.title AS title,
              d.experienceYears AS experienceYears,
              d.avatar AS avatar,
              d.bio AS bio,
              collect(s.name) AS verifiedSkills
            ORDER BY d.name
        ";

        var devs = new List<DeveloperProfileDto>();
        try
        {
            await using var session = _driver.AsyncSession();
            var cursor = await session.RunAsync(cypher);

            while (await cursor.FetchAsync())
            {
                var record = cursor.Current;
                var id = record["id"]?.ToString() ?? "";
                var name = record["name"]?.ToString() ?? "";
                var title = record["title"]?.ToString() ?? "";
                var expYears = record.Values.TryGetValue("experienceYears", out var expVal) && expVal != null ? Convert.ToInt32(expVal) : 2;
                var avatar = record["avatar"]?.ToString() ?? "";
                var bio = record["bio"]?.ToString() ?? "";

                var skillsList = new List<string>();
                if (record.Values.TryGetValue("verifiedSkills", out var rawSkills) && rawSkills is IEnumerable<object> enumSkills)
                {
                    foreach (var s in enumSkills)
                    {
                        if (s != null) skillsList.Add(s.ToString()!);
                    }
                }

                devs.Add(new DeveloperProfileDto(
                    id,
                    name,
                    title,
                    expYears,
                    avatar,
                    bio,
                    skillsList
                ));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetDevelopersAsync failed");
        }

        return devs;
    }
}

