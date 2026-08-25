using Neo4j.Driver;
using SkillGraph.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Controllers and Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "SkillGraph .NET API (CognoDB)", Version = "v1" });
});

// 2. Configure Neo4j / Bolt Driver for CognoDB Dependency Injection
builder.Services.AddSingleton<IDriver>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var uri = config["CognoDB:Uri"] ?? "bolt+s://db-43033552.bravo.databases.cognodb.com";
    var user = config["CognoDB:User"] ?? "cognodb";
    var password = config["CognoDB:Password"] ?? "8b66f1a4bbbb136517d335d00b1eaabd";

    return GraphDatabase.Driver(uri, AuthTokens.Basic(user, password), o =>
    {
        o.WithMaxConnectionPoolSize(50);
        o.WithConnectionAcquisitionTimeout(TimeSpan.FromSeconds(5));
    });
});

// 3. Register Application Services
builder.Services.AddScoped<ICognoDBService, CognoDBService>();

// 4. Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 5. Middleware Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "SkillGraph API v1"));
}

app.UseCors("AllowAll");

// Serve Frontend from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();
app.MapControllers();

app.Run();
