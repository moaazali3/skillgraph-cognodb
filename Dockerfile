# Stage 1: Build React Frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build .NET API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dotnet-build
WORKDIR /src
COPY SkillGraph.Api/SkillGraph.Api.csproj SkillGraph.Api/
RUN dotnet restore SkillGraph.Api/SkillGraph.Api.csproj
COPY SkillGraph.Api/ SkillGraph.Api/
WORKDIR /src/SkillGraph.Api
# Copy frontend build output into wwwroot (to be served by .NET)
COPY --from=frontend-build /app/dist ./wwwroot
RUN dotnet publish SkillGraph.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Final Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=dotnet-build /app/publish .
ENV ASPNETCORE_URLS=http://+:7860
EXPOSE 7860
ENTRYPOINT ["dotnet", "SkillGraph.Api.dll"]
