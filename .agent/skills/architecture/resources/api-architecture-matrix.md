# API Architecture Decision Matrix

> Use this matrix to guide users in selecting the best API architecture for their project context.

## Decision Framework

### Step 1: Who Are Your API Consumers?

| Consumer Type | Best Fit | Why |
|--------------|----------|-----|
| **Web app only (same team)** | tRPC | End-to-end type safety, zero overhead |
| **Web + Mobile (same org)** | GraphQL | Flexible queries, reduces over-fetching |
| **Third-party developers** | REST | Universal, well-documented, cacheable |
| **Microservices (internal)** | gRPC | High performance, schema-first, streaming |
| **Real-time (chat, notifications)** | WebSocket / SSE | Persistent connection, push-based |
| **IoT / Resource-constrained** | REST or MQTT | Simple, lightweight protocols |

### Step 2: Data Complexity

| Data Shape | Best Fit | Reasoning |
|-----------|----------|-----------|
| **Simple CRUD** | REST | Straightforward resource mapping |
| **Highly relational** | GraphQL | Avoid N+1 REST calls, query graphs |
| **Flat, predictable** | REST or tRPC | Simplicity wins |
| **Real-time stream** | WebSocket + REST | Combine push with pull |
| **Large binary payloads** | REST (multipart) or gRPC (streaming) | Optimized transfer |

### Step 3: Performance Requirements

| Requirement | Best Fit | Trade-off |
|------------|----------|-----------|
| **Low latency** | gRPC | Binary protocol, HTTP/2 |
| **Cacheable responses** | REST | HTTP caching, CDN-friendly |
| **Bandwidth efficiency** | GraphQL | Client specifies exact fields |
| **High throughput** | gRPC or REST | Depends on payload size |

### Step 4: Team Context

| Team Context | Recommended | Why |
|-------------|------------|-----|
| **Full TypeScript stack** | tRPC | Zero-cost type safety across boundary |
| **Polyglot backends** | REST or gRPC | Language-agnostic protocols |
| **Frontend-heavy team** | GraphQL | Frontend-driven data fetching |
| **DevOps-heavy team** | REST | Simple to monitor, cache, proxy |

---

## Quick Decision Tree

```
Start
├── Same TypeScript codebase? → tRPC
├── Third-party consumers? → REST
├── Internal microservices?
│   ├── High performance needed? → gRPC
│   └── Simple integration? → REST
├── Complex, relational data? → GraphQL
├── Real-time needed? → WebSocket / SSE
└── Unsure? → Start with REST (migrate later)
```

---

## Beginner-Friendly Analogies

| Architecture | Restaurant Analogy |
|-------------|-------------------|
| **REST** | Standard menu — you order a fixed dish, get exactly that |
| **GraphQL** | Buffet — you pick exactly what you want, no more, no less |
| **tRPC** | Chef's table — direct communication, customized experience |
| **gRPC** | Drive-through — fast, efficient, standardized format |
| **WebSocket** | Waiter who keeps coming to your table with updates |
