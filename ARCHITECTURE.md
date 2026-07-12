# AI Quest Platform - Architecture Blueprint

This document details the production-ready architecture of the **AI Quest Platform**, designed using **Domain-Driven Design (DDD)**, **Clean Architecture**, and **SOLID** principles, adapted for our high-performance full-stack React/Express workspace.

---

## 1. System Topology & Module Structure

The platform is organized into clean, independent modules mimicking a monorepo structure. Within our full-stack app, this is mapped into logical subdirectories that compile into a unified, high-performance bundle.

```
/
├── server.ts                 # Full-stack Express entrypoint & Vite middleware orchestrator
├── ARCHITECTURE.md           # This architecture design document
├── package.json              # Dependency definitions & build orchestration
├── tsconfig.json             # TypeScript compiler options
├── src/
│   ├── main.tsx              # React client entrypoint
│   ├── App.tsx               # Main SPA router & frame orchestrator (Admin vs. Player)
│   ├── index.css             # Tailwind styling configuration
│   │
│   ├── apps/                 # Unified Frontend Applications
│   │   ├── admin/            # Organizer Portal (Project/NPC creation, logs, live events)
│   │   └── player/           # Mobile PWA Client (Interactive Gamemaster Chat, QR scanner, camera)
│   │
│   └── packages/             # Independent Shared Packages & Engines
│       ├── types/            # Strict types & data schemas (Quest, User, NPC, Lore, State)
│       ├── ui/               # Shared visual primitives & design tokens
│       ├── quest-engine/     # State machine for quest processing, step verification, and inventory
│       ├── ai-engine/        # Multi-model interface (Gemini, OpenAI, Anthropic, OpenRouter)
│       ├── vision-engine/    # AI Multimodal Image Verification (>80% confidence match)
│       └── notifications/    # Real-time Server-Sent Events (SSE) stream for live event orchestration
```

---

## 2. Domain-Driven Design (DDD) Layers

### 2.1 Core Entities & Value Objects (Domain Layer)
- **QuestProject**: Represents a specific quest project (e.g., "Spirit of Ichchi", "Lighthouse Curse").
  - Includes: `id`, `name`, `lore` (Story, Rules, System Prompt), `npc` dictionary, `questSteps`.
- **NPC**: Non-Player Character config.
  - Includes: `id`, `name`, `role`, `avatar`, `personalityPrompt`, `baseRanks`.
- **PlayerProfile**: Active participant data.
  - Includes: `userId`, `username`, `level`, `rank`, `xp`, `inventory` (`Array<Item>`), `achievements` (`Array<string>`), `questStates` (`Record<questId, QuestProgressState>`).
- **QuestStep**: Verification checkpoints.
  - Types: `TEXT` | `QR` | `PHOTO` | `LOCATION` | `TIMER` | `CUSTOM`.
  - Verification Payload: Answers, reference photos (stored server-side), location bounds.

### 2.2 Domain Services
- **QuestEngineService**: Evaluates if player actions satisfy step conditions. Handles rewards, rank calculation, and item injection.
- **AIEngineService**: Interacts with the LLM API to generate contextual responses tailored to player ranks, items, and current step context.
- **VisionEngineService**: Performs multi-modal comparison of user-taken photo against the locked reference image.

---

## 3. Storage & Local Database Repository (Repository Pattern)

To achieve durable, out-of-the-box local storage that functions perfectly without complex cloud dependencies, the platform implements a **Local JSON File Database (`LocalFileDB`)** wrapping the Repository Pattern. 

- All database operations go through an abstract `IQuestRepository` interface.
- Complete ACID-like behavior is maintained in-memory with scheduled flush-to-disk callbacks to ensure zero state corruption or loss during container restarts.

---

## 4. Multi-Model AI Engine Specification

The AI Engine provides a unified interface `IAIEngine` to wrap different AI model APIs:

```typescript
export interface IAIEngine {
  generateResponse(params: {
    systemPrompt: string;
    conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; text: string }>;
    playerContext: { rank: string; level: number; inventory: string[] };
    userMessage: string;
  }): Promise<string>;
}
```

### Supported Providers:
1. **Gemini (Active Production Implementation):** Direct server-side integration using `@google/genai` (model `gemini-3.5-flash`).
2. **OpenAI / Anthropic / OpenRouter (Mock/Configurable Implementations):** Clean boilerplate patterns ready to plug in API keys.

---

## 5. Verification Algorithms

### 5.1 Photo Verification (Vision Engine)
- The reference image is stored solely on the server (never exposed to the client to prevent scraping).
- When a player submits a photo (base64 PNG/JPEG) for verification, the server makes a multimodal call to `gemini-3.5-flash` passing:
  1. The reference image.
  2. The player's submitted image.
  3. A strict validation prompt instructing the model to compare visual features, key objects, background settings, and lighting, returning a similarity score from 0 to 100 in JSON format.
- **Pass threshold**: $\geq 80\%$.

### 5.2 Text Verification
- Removes casing (`.toLowerCase()`).
- Trims all double/trailing whitespace and punctuation.
- Compares against a list of acceptable alternative answers.

---

## 6. API Interface Contracts

### 6.1 Admin API
- `GET /api/admin/projects` - List all quest projects.
- `POST /api/admin/projects` - Create a new project.
- `GET /api/admin/projects/:id` - Get project configuration (Lore, NPCs, Steps).
- `PUT /api/admin/projects/:id` - Update project configuration.
- `POST /api/admin/projects/:id/publish` - Publish a quest to the public list.
- `POST /api/admin/projects/:id/stop` - Unpublish a quest.
- `POST /api/admin/projects/:id/live-event` - Push a live event immediately to all active players.
- `GET /api/admin/players` - Get active players' profiles, levels, inventories, and progress tracking.

### 6.2 Player API
- `GET /api/player/quests` - List all published/available quests.
- `POST /api/player/join` - Join/Register a player to a quest.
- `GET /api/player/profile` - Fetch current player statistics, rank, inventory, and achievements.
- `POST /api/player/chat` - Interact with the AI Gamemaster. Handles real-time text/photo step verification and updates lore context.
- `POST /api/player/verify-qr` - Verify scanned QR code against current step requirements.
- `POST /api/player/verify-location` - Check latitude/longitude coordinate bounds.
- `GET /api/player/events` - SSE (Server-Sent Events) endpoint for real-time notifications and instant Live Organizer Event popups.

---

Now that the architecture is fully detailed and structured, we will automatically transition to the full **Backend Implementation**, configuring `server.ts` to implement this robust API engine and Quest State Machine.
