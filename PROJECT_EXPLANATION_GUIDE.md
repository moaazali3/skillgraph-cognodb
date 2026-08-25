# 📘 دليل الشرح الشامل لمشروع SkillGraph (.NET 9 / C# & CognoDB)

هذا الدليل تم إعداده خصيصاً لمساعدتك على **فهم ومناقشة كل جزء في المشروع بثقة كاملة في المقابلة التقنية**، ومعرفة أسباب القرارات الهندسية التي تم اتخاذها.

---

## 📌 1. فكرة المشروع باختصار (The Core Idea)
**SkillGraph** هو محرك ذكاء اصطناعي مهني يعتمد على **قاعدة بيانات رسومية (Graph Database)** مبني على منصة **CognoDB Cloud** باستخدام لغة **C# / ASP.NET Core**.

يقوم المشروع برسم شبكة معرفية متكاملة تربط بين:
1. **المهارات التقنية (`Skill`)**: مثل (C#, React, Docker, PyTorch, RAG Architecture, Distributed Systems).
2. **علاقات المتطلبات القبلية متعددة القفزات (`PREREQUISITE_FOR`)**: مثل: `Python ➔ Math ➔ Pandas ➔ PyTorch ➔ Transformers ➔ RAG`.
3. **الوظائف ومستوياتها (`Role`)**: مع المهارات المطلوبة لكل وظيفة ونطاق الراتب.
4. **ملفات المطورين (`Developer`)**: مع المهارات التي يمتلكونها وسنوات الخبرة.
5. **الكورسات والمشاريع (`Course`, `Project`)**: المرتبطة مباشرة بالمهارات الناقصة.

---

## 🎯 2. لماذا Graph Database وليس Relational SQL؟ (سؤال المقابلة الأهم)

| وجه المقارنة | قواعد البيانات العلائقية (Relational / SQL) | قواعد البيانات الرسومية (CognoDB / openCypher) |
| :--- | :--- | :--- |
| **المسارات التكرارية (Multi-Hop Chains)** | تحتاج إلى `WITH RECURSIVE` (Recursive CTEs) بطيئة ومعقدة في الصيانة وتتطلب معالجة الحلقات الدائرية يدوياً. | استعلام بسيط وأنيق بسطر واحد يحدد عمق القفزات: `(:Skill)-[:PREREQUISITE_FOR*1..5]->(:Skill)`. |
| **تعدد الكيانات والعلاقات** | تتطلب عشرات جداول الربط (`Junction / Join Tables`) مثل `RoleSkills`, `DevSkills`, `CourseSkills` وتصبح الاستعلامات بطيئة بسبب كثرة الـ `JOINs`. | العلاقات مخزنة بشكل أصيل (`Native Pointers`)؛ التنقل بين الكيانات سريع جداً وثابت الزمن ($O(1)$ لكل قفزة). |
| **تحليل المسار المهني (Degree Centrality)** | حساب "المهارة الأعلى عائداً التي تفتح أكبر عدد من الوظائف" يتطلب Aggregations معقدة جداً. | استعلام Pattern Matching مباشر وسريع لحساب درجة الاتصال والتقارب. |

---

## 🏛️ 3. معمارية الـ Backend بـ C# (.NET Architecture Walkthrough)

تم تنظيم المشروع وفق أفضل الممارسات الهندسية لـ **ASP.NET Core Clean Architecture**:

```text
SkillGraph.Api/
├── Controllers/
│   ├── HealthController.cs       # GET /api/health (فحص اتصال CognoDB وسرعة الاستجابة)
│   ├── GraphController.cs        # GET /api/graph (جلب العقد والروابط للرسم البياني)
│   ├── PathFinderController.cs   # GET /api/path (استعلام الـ Multi-Hop Traversal)
│   ├── SkillGapController.cs     # GET /api/skill-gap (تحليل فجوة المهارات وحساب الجاهزية)
│   └── SeedController.cs         # POST /api/seed (إعادة ملء قاعدة البيانات)
├── Services/
│   ├── ICognoDBService.cs        # عقد الخدمة (Interface) لـ Dependency Injection
│   └── CognoDBService.cs         # المنطق الفعلي وتنفيذ استعلامات Cypher
├── Models/
│   └── GraphModels.cs            # C# Records & DTOs لتمثيل البيانات
├── Data/
│   └── DatabaseSeeder.cs         # سكريبت إدخال البيانات المبدئية في CognoDB
├── wwwroot/                      # الواجهة التفاعلية (HTML5 / Vanilla CSS / JS Canvas)
├── appsettings.json              # إعدادات الاتصال بـ CognoDB Cloud
└── Program.cs                    # إعداد الـ DI و Swagger والـ Static Files
```

---

## 🔍 4. شرح ملفات الكود الأساسية بالتفصيل

### أ. ملف `Program.cs` (نقطة انطلاق التطبيق)
- **تسجيل الـ Driver عبر الـ DI**:
  قمنا بتسجيل `IDriver` الخاص بمكتبة `Neo4j.Driver` كـ `Singleton` لضمان إعادة استخدام مجمع الاتصالات (Connection Pool) بكفاءة:
  ```csharp
  builder.Services.AddSingleton<IDriver>(sp => {
      var config = sp.GetRequiredService<IConfiguration>();
      var uri = config["CognoDB:Uri"];
      var user = config["CognoDB:User"];
      var password = config["CognoDB:Password"];
      return GraphDatabase.Driver(uri, AuthTokens.Basic(user, password), o => {
          o.WithMaxConnectionPoolSize(50);
          o.WithConnectionAcquisitionTimeout(TimeSpan.FromSeconds(5));
      });
  });
  ```
- **تسجيل خدمة الـ Service**: `builder.Services.AddScoped<ICognoDBService, CognoDBService>();`
- **تفعيل Swagger والـ Static Files**: لتقديم الـ UI مباشرة من `wwwroot`.

---

### ب. ملف `Services/CognoDBService.cs` (محرك الاستعلامات)
يحتوي على الدوال التي تنفذ استعلامات openCypher بشكل **Parameterized** (لحماية قاعدة البيانات ورفع الأداء):

#### 1. استعلام المسار متعدد القفزات (`FindPrerequisitePathsAsync`):
```cypher
MATCH path = (prereq:Skill)-[:PREREQUISITE_FOR*1..5]->(target:Skill {id: $targetSkillId})
RETURN 
  [n IN nodes(path) | { id: n.id, name: n.name, category: n.category, difficulty: n.difficulty }] AS pathNodes,
  length(path) AS hops
ORDER BY hops DESC
```
* **الشرح**: يبدأ من أي مهارة أساسية ويمر عبر علاقات `PREREQUISITE_FOR` من قفزة واحدة حتى 5 قفزات ليصل إلى المهارة المطلوبة، ويعيد أسماء العقد وعدد القفزات.

#### 2. استعلام فجوة المهارات والجاهزية (`AnalyzeSkillGapAsync`):
```cypher
MATCH (d:Developer {id: $devId})
MATCH (r:Role {id: $roleId})
MATCH (r)-[req:REQUIRES_SKILL]->(needed:Skill)
OPTIONAL MATCH (d)-[prof:PROFICIENT_IN]->(needed)
OPTIONAL MATCH (c:Course)-[:TEACHES]->(needed)
OPTIONAL MATCH (p:Project)-[:BUILT_WITH]->(needed)
OPTIONAL MATCH (d)-[:PROFICIENT_IN]->(owned:Skill)-[:PREREQUISITE_FOR*1..3]->(needed)
RETURN 
  needed.id AS skillId,
  needed.name AS skillName,
  req.minLevel AS requiredLevel,
  prof IS NOT NULL AS isAcquired,
  count(DISTINCT owned) AS readinessBonus,
  collect(DISTINCT c) AS courses
ORDER BY isAcquired ASC, req.weight DESC, readinessBonus DESC
```
* **الشرح**: 
  - يقارن بين مهارات المطور `d` ومتطلبات الوظيفة `r`.
  - يحسب `readinessBonus`: هل يمتلك المطور مهارات تعتبر متطلباً قبلياً للمهارة الناقصة؟ (مثلاً: يملك Python ويسعى لتعلم PyTorch فتكون جاهزيته أعلى).

---

## 🚀 5. خطوات تشغيل المشروع وتجربته

### التشغيل عبر التيرمينال:
```bash
# الانتقال لمجلد المشروع
cd SkillGraph.Api

# تشغيل التطبيق
dotnet run
```

### الروابط المتاحة:
- 🌐 **الواجهة التفاعلية (Web UI)**: [http://localhost:5000](http://localhost:5000) (أو المنفذ المحدد في التيرمينال).
- 📑 **Swagger API Documentation**: [http://localhost:5000/swagger](http://localhost:5000/swagger).
