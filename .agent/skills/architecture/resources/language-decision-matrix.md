# Language Decision Matrix

> Use this matrix to guide users in selecting the best programming language for their project context.

## Decision Framework

### Step 1: What Type of Application?

| Application Type | Primary Options | Alternatives |
|-------------------|----------------|--------------|
| **Web Frontend** | TypeScript, JavaScript | Dart (Flutter Web) |
| **Web Backend / API** | TypeScript (Node.js), Python, Go | Rust, Java, C# |
| **Mobile (Cross-platform)** | TypeScript (React Native), Dart (Flutter) | Kotlin Multiplatform |
| **Mobile (Native iOS)** | Swift | Objective-C |
| **Mobile (Native Android)** | Kotlin | Java |
| **Data Science / ML** | Python | R, Julia |
| **Systems / Infrastructure** | Rust, Go | C, C++ |
| **Game Development** | C#, C++ | GDScript, Lua |
| **CLI Tools** | Go, Rust | Python, Node.js |
| **Desktop Applications** | TypeScript (Electron), C#, Rust (Tauri) | Python, Java |

### Step 2: Performance vs Speed-to-Market

| Priority | Best Fit Languages | Trade-off |
|----------|-------------------|-----------|
| **Speed to market** | Python, TypeScript | Lower raw performance |
| **Balanced** | Go, Kotlin, C# | Good performance, decent DX |
| **Maximum performance** | Rust, C++ | Steeper learning curve, slower dev |

### Step 3: Team Size & Budget

| Context | Recommendation | Reasoning |
|---------|---------------|-----------|
| **Solo dev / MVP** | Python or TypeScript | Fastest iteration, largest ecosystems |
| **Small team (2-5)** | TypeScript or Go | Type safety, easy onboarding |
| **Large team (10+)** | TypeScript, Java, C# | Strong typing, tooling, conventions |
| **Budget-constrained hosting** | Go, Rust | Low memory/CPU footprint |

### Step 4: Ecosystem Maturity

| Language | Package Ecosystem | Enterprise Adoption | Community |
|----------|------------------|-------------------|-----------|
| **TypeScript** | ★★★★★ (npm) | ★★★★ | ★★★★★ |
| **Python** | ★★★★★ (pip) | ★★★★ | ★★★★★ |
| **Go** | ★★★ | ★★★★ | ★★★ |
| **Rust** | ★★★ | ★★ | ★★★ |
| **Java** | ★★★★★ (Maven) | ★★★★★ | ★★★★ |
| **C#** | ★★★★ (NuGet) | ★★★★★ | ★★★ |

---

## Beginner-Friendly Analogies

| Language | Vehicle Analogy |
|----------|----------------|
| **Python** | Automatic car — easy to drive, gets you there fast |
| **TypeScript** | Modern sedan with GPS — safe, guided, reliable |
| **Go** | Electric motorcycle — fast, efficient, minimal |
| **Rust** | Race car — blazing fast but requires skill to drive |
| **Java** | Commercial truck — handles heavy loads, proven reliability |
