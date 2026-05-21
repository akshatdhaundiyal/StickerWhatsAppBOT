# Antigravity Agent Instructions

This directory contains persistent instructions for agent pairing sessions working on this repository. All subsequent AI agents assisting on this codebase MUST strictly adhere to the guidelines detailed below.

---

## 📋 Architectural Integrity

* **Command Pattern Structure:** Maintain the modular Command Pattern architecture under `src/`. Never cluster multiple commands or unrelated logic back into the monolithic entrypoint `index.js`.
* **Segregation of Concerns:**
  * Keep configuration separate (`config/config.json`).
  * Keep client setup isolated (`src/client.js`).
  * Route and filter events inside the core handler (`src/handlers/messageHandler.js`).
  * Isolate custom command business logic into pluggable files under `src/commands/`.
  * Standardize all logging formatting through the consolidated logger utility (`src/utils/logger.js`).

---

## 💻 Programming Best Practices & Conventions

Subsequent agents must adhere to the following code optimization and diagnostic standards established during refactoring:

1. **Short-Circuit Asynchronous Commands:**
   * Always evaluate lightweight synchronous boolean parameters (e.g., `message.hasQuotedMsg`) before firing expensive asynchronous operations (e.g., `message.getQuotedMessage()`). This avoids unnecessary Puppeteer browser executions on text messages.
2. **Explicit Error Capture & Logging:**
   * Never implement silent, empty catch blocks (e.g., `catch {}`). Always capture the error object (`catch (err)`) and log the complete traceback/message via the dynamic logging system (`logger(..., 'error')`) to preserve diagnostic trace logs in production.
3. **Status Message Cleanup (UX):**
   * Keep chats clean of loading message spam. Always catch the promise of temporary status indicators (such as `Loading..`) and invoke `.delete(true).catch(() => {})` on command success or failure.
4. **Binary & Dependency Controls:**
   * Never host raw, architecture-restricted binaries (`.exe` or `.bin` files) in the repository. Relies strictly on platform-agnostic npm wrappers (e.g., `ffmpeg-static`) that resolve operating-system-specific paths dynamically.
5. **Comprehensive Inline Code Comments:**
   * Always produce highly detailed JSDoc block comments for modules, functions, parameters, and callback systems, paired with exhaustive inline comments explaining the execution steps of all asynchronous methods, media downloads, and dynamic transcoding operations.

---

## ✍️ Documentation Rigor & Formatting (CRITICAL DIRECTIVE)

You must **always prioritize highly detailed, comprehensive documentation**. Draft files with maximum technical depth, step-by-step clarity, code fragments, sequence timelines, and data flows. Minimalist, placeholder, or brief summaries are strictly unacceptable.

### 1. Milestone Documentation Conventions
All project milestones and design outlines must be recorded under `docs/design_docs/`.
* **Zero-Padded 2-Digit Filenames:** Filenames for milestones must strictly follow the pattern `XX_milestone_title.md` (e.g., `00_milestone_summary.md`, `01_reliability_and_fixes.md`).
* **Roadmap Summary Dashboard:** `00_milestone_summary.md` acts as the primary registry and Gantt chart. Any time a milestone is drafted, in-progress, or completed, this registry must be immediately updated.

### 2. Architecture Specifications
* **Architecture File Location:** The master system architecture specification resides in `docs/architecture.md`.
* **Continuous Updates:** Whenever components, routers, or media pipelines are refactored or modified, you must comprehensively update `docs/architecture.md` to guarantee documentation parity with the live code.

### 3. Visual Formatting Elements
* **Mermaid.js Diagrams:** Always embed rich, styled Mermaid.js charts for visual representation of flows (use sequence diagrams for communication loops, Gantt charts for milestone roadmaps, and flowcharts for component structure relationships).
* **Detailed Tables & Alert Callouts:** Strategically apply GitHub-flavored warning/info banners (`> [!NOTE]`, `> [!IMPORTANT]`) and structured tables to denote critical details, directory mappings, and API specifications.
