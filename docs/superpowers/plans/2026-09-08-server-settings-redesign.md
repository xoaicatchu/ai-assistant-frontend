# Server Settings Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tách selector server khỏi màn hình cấu hình, bổ sung danh sách/nhiều custom server và đưa MCP về đúng ngữ cảnh server detail.

**Architecture:** Giữ App làm composition root hiện tại nhưng đưa profile server vào domain/storage với migration tương thích schema cũ. Settings được biểu diễn bằng state URL `/settings/servers` và `/settings/servers/:id`; chat chỉ render conversation tabs khi đang ở chat. Header selector dùng profile hiện tại và chỉ hiển thị nhãn rút gọn.

**Tech Stack:** Angular 21 standalone component, TypeScript, Vitest, CSS, browser History API.

## Global Constraints

- Không làm mất dữ liệu cấu hình schema cũ trong localStorage.
- Không hiển thị URL endpoint đầy đủ trong header hoặc selector.
- Không render conversation tabs trên mọi trang Settings.
- Model picker chỉ hiển thị model thuộc server đang chọn.
- MCP chỉ xuất hiện trong server detail dưới dạng phần hướng dẫn thu gọn.
- Chạy focused tests, toàn bộ Vitest và production build trước khi bàn giao.

---

### Task 1: Server profile model and storage migration

**Files:**
- Create: `src/app/domain/server/server-profile.ts`
- Create: `src/app/domain/server/server-profile.spec.ts`
- Modify: `src/app/infrastructure/browser/setup-storage.ts`
- Modify: `src/app/infrastructure/browser/setup-storage.spec.ts`

**Interfaces:**
- `ServerProfile`: `{ id: string; name: string; baseUrl: string; apiKey: string; models: string[]; selectedModel: string }`.
- `DEFAULT_SERVER_PROFILE`: read-only profile metadata for the built-in backend.
- `normalizeServerProfile(input, fallbackId)`: returns a normalized profile.
- `migrateCustomServers(input)`: converts old single-custom fields to one profile and preserves new profiles.

- [ ] **Step 1: Write failing tests** for profile normalization, stable IDs, and old-schema migration.
- [ ] **Step 2: Run `npm test -- src/app/domain/server/server-profile.spec.ts src/app/infrastructure/browser/setup-storage.spec.ts` and confirm failure.**
- [ ] **Step 3: Implement profile types/helpers and extend setup storage with `customServers` and `activeServerId` while keeping old effective fields.**
- [ ] **Step 4: Run the focused tests and confirm pass.**
- [ ] **Step 5: Commit `feat: add persistent server profiles`.**

### Task 2: Settings route state and server activation

**Files:**
- Create: `src/app/domain/server/settings-route.ts`
- Create: `src/app/domain/server/settings-route.spec.ts`
- Modify: `src/app/presentation/shell/app.ts`
- Modify: `src/app/presentation/shell/app.spec.ts`

**Interfaces:**
- `SettingsRoute = { page: 'servers' } | { page: 'server-detail'; serverId: string }`.
- `readSettingsRoute(pathname)`: parses only `/settings/servers` and `/settings/servers/:id`.
- `settingsRouteUrl(route)`: returns the canonical pathname.

- [ ] **Step 1: Write failing tests** for route parsing and activating a custom profile without mixing its models with built-ins.
- [ ] **Step 2: Run the focused tests and confirm failure.**
- [ ] **Step 3: Add settings route state, history updates, profile activation, create/edit/delete navigation, and health state keyed by profile ID.**
- [ ] **Step 4: Run focused App and route tests and confirm pass.**
- [ ] **Step 5: Commit `feat: add server settings navigation`.**

### Task 3: Separate server list and detail templates

**Files:**
- Modify: `src/app/presentation/shell/app.html`
- Modify: `src/app/presentation/shell/app.ts`
- Modify: `src/app/presentation/shell/app.spec.ts`

- [ ] **Step 1: Add failing template contract assertions** for no conversation tabs on Settings, compact header label, server list, and detail edit controls.
- [ ] **Step 2: Run the focused test and confirm failure.**
- [ ] **Step 3: Render a Settings subnav without conversation tabs; render server list cards and a server detail form; move MCP help into detail only.**
- [ ] **Step 4: Run focused tests and confirm pass.**
- [ ] **Step 5: Commit `feat: split server list and detail views`.**

### Task 4: Visual system and responsive selector

**Files:**
- Modify: `src/app/presentation/shell/app.css`
- Modify: `src/styles.css`
- Modify: `src/app/presentation/shell/app-layout.spec.ts`

- [ ] **Step 1: Add failing CSS contract assertions** for compact selector, list/detail layout, and mobile overflow protection.
- [ ] **Step 2: Run the focused test and confirm failure.**
- [ ] **Step 3: Replace long selector/menu styling with compact surfaces, profile cards, detail sections, and mobile rules that keep labels readable without horizontal overflow.**
- [ ] **Step 4: Run layout tests and production build.**
- [ ] **Step 5: Commit `style: refine server settings surfaces`.**

### Task 5: Full regression and delivery

**Files:**
- Verify: `src/app/**/*.spec.ts`, `docs/superpowers/specs/2026-09-08-server-settings-redesign-design.md`, `docs/superpowers/plans/2026-09-08-server-settings-redesign.md`

- [ ] **Step 1: Run `npm test` and confirm all tests pass.**
- [ ] **Step 2: Run `npm run build` and confirm production build succeeds.**
- [ ] **Step 3: Run `git diff --check` and confirm no whitespace errors.**
- [ ] **Step 4: Inspect the changed files and verify master is clean.**
- [ ] **Step 5: Push `master` to `origin` and verify the deployed bundle references the new UI.**
