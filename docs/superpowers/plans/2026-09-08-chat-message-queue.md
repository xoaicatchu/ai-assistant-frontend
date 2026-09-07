# Chat Message Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép người dùng gửi nhiều câu hỏi liên tiếp trong lúc AI đang stream, xử lý FIFO sau khi câu trước kết thúc và giữ hội thoại liền mạch.

**Architecture:** Tạo một queue thuần TypeScript ở application layer, chịu trách nhiệm FIFO, trạng thái chờ, hủy item và điều phối worker tuần tự. `App` chỉ snapshot request, render trạng thái, rồi chạy từng item qua `ChatUseCases.stream`; lỗi hoặc stop của item hiện tại không làm mất các item còn lại.

**Tech Stack:** Angular 21 signals, TypeScript, Vitest, existing `ChatUseCases`/`ChatService` streaming API.

## Global Constraints

- Không tạo conversation/server record cho tới khi câu hỏi đầu tiên thực sự bắt đầu xử lý.
- Không gửi request song song trong cùng conversation.
- Snapshot model, image và nội dung tại thời điểm enqueue.
- Dừng request hiện tại nhưng giữ nguyên queue phía sau.
- Lỗi một request phải chuyển worker sang request tiếp theo.
- Không dùng localStorage cho `File`; queue attachment chỉ sống trong phiên browser hiện tại.

---

### Task 1: Add a tested FIFO queue primitive

**Files:**
- Create: `src/app/application/chat/chat-request-queue.ts`
- Test: `src/app/application/chat/chat-request-queue.spec.ts`

**Interfaces:**
- `ChatQueueItem<T>`: `{ id: number; payload: T }`.
- `ChatRequestQueue<T>`: `enqueue(payload: T): ChatQueueItem<T>`, `remove(id: number): boolean`, `clear(): void`, `snapshot(): readonly ChatQueueItem<T>[]`, `isRunning(): boolean`, `run(worker: (item: ChatQueueItem<T>) => Promise<void>): Promise<void>`.
- `run()` guarantees one worker at a time, drains FIFO, and continues after worker rejection.

- [x] **Step 1: Write failing tests** for FIFO order, single active worker, continued draining after rejection, removal, and stop/clear behavior.
- [x] **Step 2: Run `npm test -- --run src/app/application/chat/chat-request-queue.spec.ts` and confirm failure because the queue module is absent.
- [x] **Step 3: Implement the minimal queue with an internal array, `running` flag, monotonic ids, and `try/catch` around each worker item.
- [x] **Step 4: Run the focused test and confirm all queue tests pass.
- [x] **Step 5: Commit `feat: add fifo chat request queue`.

### Task 2: Integrate enqueue/drain into App

**Files:**
- Modify: `src/app/presentation/shell/app.ts`
- Modify: `src/app/presentation/shell/app.html`
- Modify: `src/app/presentation/shell/app.css`
- Test: `src/app/presentation/shell/app.spec.ts`

**Interfaces:**
- Add `QueuedChatRequest` payload containing `conversationId`, `content`, optional `image`, `model`, `requestId`, `userMessageId`, `assistantId`.
- `send()` validates and snapshots input, appends a queued user message, clears the composer, enqueues the payload, then starts `drainChatQueue()` without stopping the active request.
- `processQueuedRequest(item)` builds API history immediately before stream start, appends its pending assistant message, and delegates to existing `runRequest()`.

- [x] **Step 1: Add failing App tests** proving a second `send()` during an unresolved stream does not abort the first, creates two queued requests, preserves selected model per request, and calls stream in order after resolving each promise.
- [x] **Step 2: Run the focused App tests and confirm they fail against current stop-on-busy behavior.
- [x] **Step 3: Replace the `busy` branch in `send()` with enqueue logic; retain validation before enqueue and snapshot all request-specific values.
- [x] **Step 4: Refactor `runRequest()` so it only owns one active request and completion state; make `drainChatQueue()` call it sequentially and continue after errors.
- [x] **Step 5: Make `stop()` abort only `activeRequests` and leave queued payloads intact; add `cancelQueuedRequest(id)`.
- [x] **Step 6: Update the template with a compact queue strip showing pending count/items and a remove button; keep composer enabled while an active request exists and show stop only for the active request.
- [x] **Step 7: Add styles for pending queue items, mobile wrapping, and accessible focus/labels.
- [x] **Step 8: Run focused App tests and confirm they pass.
- [x] **Step 9: Commit `feat: queue chat messages while streaming`.

### Task 3: Preserve continuity and existing interactions

**Files:**
- Modify: `src/app/presentation/shell/app.ts`
- Modify: `src/app/presentation/shell/app.spec.ts`
- Modify: `src/app/domain/conversation/conversation-state.ts` only if the continuity filter needs a targeted adjustment.

- [x] **Step 1: Add tests for a queued user message followed by a completed assistant response, verifying the next request contains both prior turns in exact order.
- [x] **Step 2: Add tests that an error in request 1 still starts request 2, and stop in request 1 still leaves request 2 pending.
- [x] **Step 3: Ensure replay/edit while busy enqueues a replacement instead of aborting unrelated queued work; reject edits that would create ambiguous history after later queued items.
- [x] **Step 4: Verify conversation title, URL creation and server sync happen once for the first real user message and do not create records for empty tabs or queued-only state.
- [x] **Step 5: Run focused regression tests and commit `test: preserve queued conversation continuity`.

### Task 4: Full verification and delivery

**Files:**
- Modify: `docs/superpowers/plans/2026-09-08-chat-message-queue.md` to mark completed steps.

- [x] **Step 1: Run `npm test -- --run` and record the complete result.
- [x] **Step 2: Run `npm run build` and confirm exit code 0.
- [x] **Step 3: Inspect `git diff`, confirm no unrelated files or secrets changed.
- [ ] **Step 4: Push `master` to `origin` and inspect the resulting Vercel deployment status when available.
- [ ] **Step 5: Only report completion with fresh test/build/deployment evidence.
