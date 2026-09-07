export interface ChatQueueItem<T> {
  id: number;
  payload: T;
}

/**
 * Small FIFO coordinator for requests that must share one conversation.
 * Worker failures are isolated to their item so the queue can keep draining.
 */
export class ChatRequestQueue<T> {
  private readonly items: ChatQueueItem<T>[] = [];
  private nextId = 1;
  private running = false;
  private drainPromise: Promise<void> | null = null;

  enqueue(payload: T): ChatQueueItem<T> {
    const item = { id: this.nextId++, payload };
    this.items.push(item);
    return item;
  }

  remove(id: number): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) {
      return false;
    }

    this.items.splice(index, 1);
    return true;
  }

  clear(): void {
    this.items.length = 0;
  }

  snapshot(): readonly ChatQueueItem<T>[] {
    return [...this.items];
  }

  isRunning(): boolean {
    return this.running;
  }

  run(worker: (item: ChatQueueItem<T>) => Promise<void>): Promise<void> {
    if (this.drainPromise) {
      return this.drainPromise;
    }

    this.running = true;
    this.drainPromise = this.drain(worker).finally(() => {
      this.running = false;
      this.drainPromise = null;
    });
    return this.drainPromise;
  }

  private async drain(worker: (item: ChatQueueItem<T>) => Promise<void>): Promise<void> {
    while (this.items.length > 0) {
      const item = this.items.shift();
      if (!item) {
        continue;
      }

      try {
        await worker(item);
      } catch {
        // A failed request must not strand later messages in the queue.
      }
    }
  }
}
