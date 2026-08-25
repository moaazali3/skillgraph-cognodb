using Neo4j.Driver;

namespace SkillGraph.Api.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IDriver driver)
    {
        await using var session = driver.AsyncSession();

        // 1. Cleanly clear database and consume result
        var clearRes = await session.RunAsync("MATCH (n) DETACH DELETE n");
        await clearRes.ConsumeAsync();

        // 2. Create Skills
        var skills = new[]
        {
            new { id = "html-css", name = "HTML5 & Modern CSS", category = "Frontend", difficulty = "Beginner", marketDemand = 85, description = "Semantic markup, Flexbox, Grid, CSS Variables, and responsive layouts.", iconName = "Layout" },
            new { id = "javascript", name = "JavaScript (ESNext)", category = "Frontend", difficulty = "Beginner", marketDemand = 98, description = "Async programming, closures, event loop, prototype inheritance, and DOM.", iconName = "Code" },
            new { id = "typescript", name = "TypeScript", category = "Frontend", difficulty = "Intermediate", marketDemand = 96, description = "Generics, union types, strict typing, and compiler tooling.", iconName = "FileCode" },
            new { id = "react", name = "React 19 & Hooks", category = "Frontend", difficulty = "Intermediate", marketDemand = 95, description = "Component lifecycle, custom hooks, Server Components, and Concurrent Mode.", iconName = "Layers" },
            new { id = "nextjs", name = "Next.js (App Router)", category = "Frontend", difficulty = "Intermediate", marketDemand = 92, description = "Server-side rendering, streaming SSR, API routes, and caching mechanics.", iconName = "Globe" },
            new { id = "web-perf", name = "Web Performance & Core Vitals", category = "Frontend", difficulty = "Advanced", marketDemand = 88, description = "LCP, CLS, INP optimization, bundle splitting, memory leak diagnosis.", iconName = "Zap" },
            new { id = "state-mgmt", name = "Advanced State Architecture", category = "Frontend", difficulty = "Intermediate", marketDemand = 84, description = "Zustand, Redux Toolkit, TanStack Query, optimistic UI patterns.", iconName = "Cpu" },

            new { id = "csharp-dotnet", name = "C# & .NET 9 Core", category = "Backend", difficulty = "Intermediate", marketDemand = 97, description = "LINQ, async/await, ASP.NET Core Web APIs, Entity Framework Core, and Dependency Injection.", iconName = "Server" },
            new { id = "nodejs", name = "Node.js Runtime", category = "Backend", difficulty = "Intermediate", marketDemand = 90, description = "Event-driven I/O, streams, worker threads, and HTTP server core.", iconName = "Server" },
            new { id = "python", name = "Python Core", category = "Backend", difficulty = "Beginner", marketDemand = 99, description = "Object-oriented, generators, typing, asynchronous asyncio programming.", iconName = "Terminal" },
            new { id = "fastapi", name = "FastAPI & Pydantic", category = "Backend", difficulty = "Intermediate", marketDemand = 89, description = "High-performance async Python APIs, OpenAPI spec, data validation.", iconName = "Flame" },
            new { id = "sql-db", name = "PostgreSQL & SQL Modeling", category = "Backend", difficulty = "Intermediate", marketDemand = 94, description = "Relational schemas, ACID transactions, indexing strategies, EXPLAIN query plans.", iconName = "Database" },
            new { id = "redis-cache", name = "Redis & In-Memory Caching", category = "Backend", difficulty = "Intermediate", marketDemand = 87, description = "Pub/Sub, TTL, distributed locks, rate-limiting algorithms.", iconName = "HardDrive" },
            new { id = "go", name = "Go (Golang)", category = "Backend", difficulty = "Intermediate", marketDemand = 91, description = "Goroutines, channels, interfaces, memory allocation, standard library.", iconName = "Send" },
            new { id = "grpc-proto", name = "gRPC & Protocol Buffers", category = "Backend", difficulty = "Advanced", marketDemand = 86, description = "Binary serialization, bidirectional streaming, microservice RPC.", iconName = "Radio" },
            new { id = "dist-sys", name = "Distributed Systems Architecture", category = "Backend", difficulty = "Expert", marketDemand = 97, description = "CAP theorem, consensus algorithms (Raft), idempotency, partition tolerance.", iconName = "Network" },
            new { id = "rust", name = "Rust Systems Programming", category = "Backend", difficulty = "Advanced", marketDemand = 93, description = "Ownership, borrow checker, lifetimes, zero-cost abstractions, unsafe blocks.", iconName = "Shield" },

            new { id = "math-stats", name = "Linear Algebra & Statistics", category = "AI & Data", difficulty = "Intermediate", marketDemand = 85, description = "Matrix operations, eigenvalues, probability distributions, gradient descent.", iconName = "Percent" },
            new { id = "pandas-numpy", name = "NumPy & Pandas", category = "AI & Data", difficulty = "Beginner", marketDemand = 90, description = "Vectorized operations, data cleaning, feature extraction, DataFrame wrangling.", iconName = "Table" },
            new { id = "pytorch", name = "PyTorch Deep Learning", category = "AI & Data", difficulty = "Advanced", marketDemand = 95, description = "Autograd tensors, neural net layers, CUDA acceleration, backprop training.", iconName = "Activity" },
            new { id = "transformers", name = "Transformers & LLM Architecture", category = "AI & Data", difficulty = "Advanced", marketDemand = 99, description = "Self-attention, positional encoding, encoder-decoder models, tokenizer tokenomics.", iconName = "Brain" },
            new { id = "rag-arch", name = "RAG (Retrieval-Augmented Gen)", category = "AI & Data", difficulty = "Advanced", marketDemand = 97, description = "Hybrid search, re-ranking, chunking strategies, dense embeddings.", iconName = "Search" },
            new { id = "vector-dbs", name = "Vector Databases & Similarity Search", category = "AI & Data", difficulty = "Intermediate", marketDemand = 92, description = "HNSW indexing, cosine distance, metadata filtering, Pinecone/Qdrant.", iconName = "Boxes" },
            new { id = "llm-finetuning", name = "LLM Fine-Tuning (LoRA/QLoRA)", category = "AI & Data", difficulty = "Expert", marketDemand = 94, description = "PEFT, quantization, dataset curation, loss curve convergence, DPO/RLHF.", iconName = "Sparkles" },

            new { id = "linux-shell", name = "Linux OS & Shell Scripting", category = "DevOps & Cloud", difficulty = "Beginner", marketDemand = 92, description = "Process management, file systems, IPC, Bash scripts, networking socket tools.", iconName = "Terminal" },
            new { id = "docker", name = "Docker & Containerization", category = "DevOps & Cloud", difficulty = "Intermediate", marketDemand = 96, description = "Multi-stage builds, rootless containers, volume management, compose stacks.", iconName = "Box" },
            new { id = "kubernetes", name = "Kubernetes Orchestration", category = "DevOps & Cloud", difficulty = "Advanced", marketDemand = 95, description = "Pods, Deployments, Ingress controllers, CRDs, Helm charts, stateful sets.", iconName = "Compass" },
            new { id = "cicd-pipelines", name = "CI/CD Automation & GitHub Actions", category = "DevOps & Cloud", difficulty = "Intermediate", marketDemand = 90, description = "Automated test pipelines, release orchestration, artifact caching, matrix builds.", iconName = "GitBranch" },
            new { id = "terraform", name = "Terraform & Infrastructure as Code", category = "DevOps & Cloud", difficulty = "Advanced", marketDemand = 89, description = "HCL declarative cloud provisioning, state locks, multi-environment modules.", iconName = "Cloud" },
            new { id = "cloud-aws", name = "AWS Cloud Architecture", category = "DevOps & Cloud", difficulty = "Advanced", marketDemand = 94, description = "VPC subnets, IAM least privilege, ECS, SQS/SNS, serverless Lambda.", iconName = "CloudRain" },

            new { id = "graph-theory", name = "Graph Theory & Network Analysis", category = "Graph & Data", difficulty = "Intermediate", marketDemand = 86, description = "Shortest path (Dijkstra/A*), centrality metrics, graph partitioning, cycle detection.", iconName = "Share2" },
            new { id = "opencypher-neo4j", name = "openCypher & Graph Modeling", category = "Graph & Data", difficulty = "Intermediate", marketDemand = 91, description = "Pattern matching, multi-hop traversals, edge properties, sub-graph projection.", iconName = "GitFork" },
            new { id = "cognodb-cloud", name = "CognoDB Managed Graph Engine", category = "Graph & Data", difficulty = "Intermediate", marketDemand = 90, description = "Bolt 5.x protocol, high-concurrency graph queries, cloud graph storage.", iconName = "Database" },
            new { id = "gnn-models", name = "Graph Neural Networks (GNNs)", category = "Graph & Data", difficulty = "Expert", marketDemand = 88, description = "Graph Convolutional Networks (GCN), Node2Vec, link prediction, PyG.", iconName = "Cpu" }
        };

        foreach (var s in skills)
        {
            var res = await session.RunAsync(@"
                CREATE (s:Skill {
                    id: $id,
                    name: $name,
                    category: $category,
                    difficulty: $difficulty,
                    marketDemand: $marketDemand,
                    description: $description,
                    iconName: $iconName
                })
            ", s);
            await res.ConsumeAsync();
        }

        // 3. Create Roles
        var roles = new[]
        {
            new { id = "senior-fullstack", title = "Senior Full-Stack Engineer (.NET/React)", domain = "Product Engineering", seniorityLevel = "Senior", avgSalary = "$140k - $185k", description = "Builds enterprise scalable web systems across ASP.NET Core, React, SQL and Graph databases.", iconName = "Code" },
            new { id = "ai-systems-engineer", title = "AI / LLM Systems Engineer", domain = "Artificial Intelligence", seniorityLevel = "Senior", avgSalary = "$165k - $225k", description = "Designs enterprise RAG pipelines, fine-tunes open-source LLMs, and deploys vector search engines.", iconName = "Brain" },
            new { id = "cloud-devops-architect", title = "Cloud & Platform Architect", domain = "Infrastructure", seniorityLevel = "Lead", avgSalary = "$160k - $210k", description = "Architects multi-region Kubernetes clusters, IaC pipelines with Terraform, and resilient cloud networks.", iconName = "Cloud" },
            new { id = "systems-dist-engineer", title = "High-Performance Systems Engineer", domain = "Core Infrastructure", seniorityLevel = "Senior", avgSalary = "$170k - $230k", description = "Develops low latency distributed storage engines, RPC networks, and consensus protocols in C#, Rust & Go.", iconName = "Shield" },
            new { id = "graph-knowledge-engineer", title = "Graph Data & Knowledge Engineer", domain = "Data & Graph Analytics", seniorityLevel = "Senior", avgSalary = "$150k - $200k", description = "Models complex connected ontologies, manages CognoDB graph databases, and builds GraphRAG systems.", iconName = "GitFork" }
        };

        foreach (var r in roles)
        {
            var res = await session.RunAsync(@"
                CREATE (r:Role {
                    id: $id,
                    title: $title,
                    domain: $domain,
                    seniorityLevel: $seniorityLevel,
                    avgSalary: $avgSalary,
                    description: $description,
                    iconName: $iconName
                })
            ", r);
            await res.ConsumeAsync();
        }

        // 4. Create Developers
        var devs = new[]
        {
            new { id = "dev-alex", name = "Alex Chen", title = "Full-Stack .NET Developer", experienceYears = 3, avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80", bio = "Specialized in C#, ASP.NET Core, and React UI systems. Looking to expand into AI & Cloud.", targetRoleId = "ai-systems-engineer" },
            new { id = "dev-sarah", name = "Sarah Al-Mansoor", title = "Backend Python & ML Engineer", experienceYears = 4, avatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80", bio = "Experienced in Web APIs, PostgreSQL, and Redis. Passionate about transitioning to LLM systems.", targetRoleId = "ai-systems-engineer" },
            new { id = "dev-marcus", name = "Marcus Vance", title = "Junior Systems & Cloud Dev", experienceYears = 2, avatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80", bio = "Enthusiast for Linux, Docker, and CI/CD. Aspires to become a Cloud Architect.", targetRoleId = "cloud-devops-architect" },
            new { id = "dev-elena", name = "Elena Rostova", title = "Data & BI Analyst", experienceYears = 3, avatar = "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80", bio = "Proficient in SQL and statistical modeling. Pivoting toward CognoDB Graph Databases.", targetRoleId = "graph-knowledge-engineer" },
            new { id = "dev-david", name = "David Kim", title = "Senior Systems Engineer", experienceYears = 6, avatar = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80", bio = "Veteran backend builder looking to master high-concurrency distributed systems.", targetRoleId = "systems-dist-engineer" }
        };

        foreach (var d in devs)
        {
            var res = await session.RunAsync(@"
                CREATE (d:Developer {
                    id: $id,
                    name: $name,
                    title: $title,
                    experienceYears: $experienceYears,
                    avatar: $avatar,
                    bio: $bio
                })
            ", d);
            await res.ConsumeAsync();
        }

        // 5. Connect Relationships (Prerequisites & Multi-Hop Chains)
        var prereqs = new[]
        {
            new { from = "html-css", to = "javascript", importance = "mandatory" },
            new { from = "javascript", to = "typescript", importance = "mandatory" },
            new { from = "javascript", to = "react", importance = "mandatory" },
            new { from = "typescript", to = "react", importance = "recommended" },
            new { from = "react", to = "nextjs", importance = "mandatory" },
            new { from = "react", to = "state-mgmt", importance = "mandatory" },
            new { from = "nextjs", to = "web-perf", importance = "recommended" },

            new { from = "csharp-dotnet", to = "dist-sys", importance = "mandatory" },
            new { from = "csharp-dotnet", to = "grpc-proto", importance = "recommended" },
            new { from = "sql-db", to = "csharp-dotnet", importance = "mandatory" },
            new { from = "javascript", to = "nodejs", importance = "mandatory" },
            new { from = "javascript", to = "nodejs", importance = "mandatory" },
            new { from = "nodejs", to = "redis-cache", importance = "recommended" },
            new { from = "nodejs", to = "dist-sys", importance = "mandatory" },
            new { from = "python", to = "fastapi", importance = "mandatory" },
            new { from = "sql-db", to = "redis-cache", importance = "recommended" },
            new { from = "go", to = "grpc-proto", importance = "mandatory" },
            new { from = "grpc-proto", to = "dist-sys", importance = "mandatory" },
            new { from = "rust", to = "dist-sys", importance = "recommended" },
            new { from = "redis-cache", to = "dist-sys", importance = "recommended" },

            // AI Multi-Hop Chain
            new { from = "python", to = "math-stats", importance = "recommended" },
            new { from = "python", to = "pandas-numpy", importance = "mandatory" },
            new { from = "math-stats", to = "pytorch", importance = "mandatory" },
            new { from = "pandas-numpy", to = "pytorch", importance = "mandatory" },
            new { from = "pytorch", to = "transformers", importance = "mandatory" },
            new { from = "transformers", to = "rag-arch", importance = "mandatory" },
            new { from = "vector-dbs", to = "rag-arch", importance = "mandatory" },
            new { from = "transformers", to = "llm-finetuning", importance = "mandatory" },

            // DevOps Chain
            new { from = "linux-shell", to = "docker", importance = "mandatory" },
            new { from = "docker", to = "kubernetes", importance = "mandatory" },
            new { from = "docker", to = "cicd-pipelines", importance = "mandatory" },
            new { from = "kubernetes", to = "cloud-aws", importance = "recommended" },
            new { from = "terraform", to = "cloud-aws", importance = "mandatory" },

            // Graph Chain
            new { from = "sql-db", to = "graph-theory", importance = "recommended" },
            new { from = "graph-theory", to = "opencypher-neo4j", importance = "mandatory" },
            new { from = "opencypher-neo4j", to = "cognodb-cloud", importance = "mandatory" },
            new { from = "graph-theory", to = "gnn-models", importance = "mandatory" },
            new { from = "pytorch", to = "gnn-models", importance = "mandatory" },
            new { from = "cognodb-cloud", to = "rag-arch", importance = "recommended" }
        };

        foreach (var p in prereqs)
        {
            var res = await session.RunAsync(@"
                MATCH (from:Skill {id: $from}), (to:Skill {id: $to})
                CREATE (from)-[:PREREQUISITE_FOR {importance: $importance}]->(to)
            ", p);
            await res.ConsumeAsync();
        }

        // Role requirements
        var roleSkills = new[]
        {
            new { role = "senior-fullstack", skill = "csharp-dotnet", minLevel = "expert", weight = 5 },
            new { role = "senior-fullstack", skill = "react", minLevel = "expert", weight = 5 },
            new { role = "senior-fullstack", skill = "sql-db", minLevel = "intermediate", weight = 4 },
            new { role = "senior-fullstack", skill = "redis-cache", minLevel = "intermediate", weight = 3 },
            new { role = "senior-fullstack", skill = "docker", minLevel = "intermediate", weight = 3 },
            new { role = "senior-fullstack", skill = "cognodb-cloud", minLevel = "beginner", weight = 3 },

            new { role = "ai-systems-engineer", skill = "python", minLevel = "expert", weight = 5 },
            new { role = "ai-systems-engineer", skill = "pytorch", minLevel = "advanced", weight = 4 },
            new { role = "ai-systems-engineer", skill = "transformers", minLevel = "expert", weight = 5 },
            new { role = "ai-systems-engineer", skill = "rag-arch", minLevel = "expert", weight = 5 },
            new { role = "ai-systems-engineer", skill = "vector-dbs", minLevel = "expert", weight = 5 },
            new { role = "ai-systems-engineer", skill = "cognodb-cloud", minLevel = "intermediate", weight = 4 },

            new { role = "cloud-devops-architect", skill = "linux-shell", minLevel = "expert", weight = 5 },
            new { role = "cloud-devops-architect", skill = "docker", minLevel = "expert", weight = 5 },
            new { role = "cloud-devops-architect", skill = "kubernetes", minLevel = "expert", weight = 5 },
            new { role = "cloud-devops-architect", skill = "terraform", minLevel = "expert", weight = 5 },
            new { role = "cloud-devops-architect", skill = "cloud-aws", minLevel = "expert", weight = 5 },

            new { role = "graph-knowledge-engineer", skill = "graph-theory", minLevel = "expert", weight = 5 },
            new { role = "graph-knowledge-engineer", skill = "opencypher-neo4j", minLevel = "expert", weight = 5 },
            new { role = "graph-knowledge-engineer", skill = "cognodb-cloud", minLevel = "expert", weight = 5 },
            new { role = "graph-knowledge-engineer", skill = "rag-arch", minLevel = "intermediate", weight = 4 },
            new { role = "graph-knowledge-engineer", skill = "gnn-models", minLevel = "advanced", weight = 4 },

            new { role = "systems-dist-engineer", skill = "dist-sys", minLevel = "expert", weight = 5 },
            new { role = "systems-dist-engineer", skill = "grpc-proto", minLevel = "expert", weight = 5 },
            new { role = "systems-dist-engineer", skill = "csharp-dotnet", minLevel = "expert", weight = 4 },
            new { role = "systems-dist-engineer", skill = "go", minLevel = "advanced", weight = 4 },
            new { role = "systems-dist-engineer", skill = "rust", minLevel = "advanced", weight = 4 }
        };

        foreach (var rs in roleSkills)
        {
            var res = await session.RunAsync(@"
                MATCH (r:Role {id: $role}), (s:Skill {id: $skill})
                CREATE (r)-[:REQUIRES_SKILL {minLevel: $minLevel, weight: $weight}]->(s)
            ", rs);
            await res.ConsumeAsync();
        }

        // Developer Skills
        var devSkills = new[]
        {
            new { dev = "dev-alex", skill = "csharp-dotnet", level = "expert", years = 3 },
            new { dev = "dev-alex", skill = "html-css", level = "expert", years = 3 },
            new { dev = "dev-alex", skill = "javascript", level = "expert", years = 3 },
            new { dev = "dev-alex", skill = "react", level = "intermediate", years = 2 },
            new { dev = "dev-alex", skill = "sql-db", level = "intermediate", years = 2 },

            new { dev = "dev-sarah", skill = "python", level = "expert", years = 4 },
            new { dev = "dev-sarah", skill = "fastapi", level = "expert", years = 3 },
            new { dev = "dev-sarah", skill = "sql-db", level = "expert", years = 4 },
            new { dev = "dev-sarah", skill = "redis-cache", level = "intermediate", years = 2 },
            new { dev = "dev-sarah", skill = "pandas-numpy", level = "intermediate", years = 2 },

            new { dev = "dev-marcus", skill = "linux-shell", level = "expert", years = 3 },
            new { dev = "dev-marcus", skill = "docker", level = "intermediate", years = 2 },
            new { dev = "dev-marcus", skill = "cicd-pipelines", level = "intermediate", years = 2 },

            new { dev = "dev-elena", skill = "sql-db", level = "expert", years = 3 },
            new { dev = "dev-elena", skill = "pandas-numpy", level = "intermediate", years = 2 },
            new { dev = "dev-elena", skill = "math-stats", level = "intermediate", years = 2 },

            new { dev = "dev-david", skill = "csharp-dotnet", level = "expert", years = 6 },
            new { dev = "dev-david", skill = "dist-sys", level = "intermediate", years = 3 },
            new { dev = "dev-david", skill = "sql-db", level = "expert", years = 5 }
        };

        foreach (var ds in devSkills)
        {
            var res = await session.RunAsync(@"
                MATCH (d:Developer {id: $dev}), (s:Skill {id: $skill})
                CREATE (d)-[:PROFICIENT_IN {level: $level, yearsOfExp: $years}]->(s)
            ", ds);
            await res.ConsumeAsync();
        }
    }
}
