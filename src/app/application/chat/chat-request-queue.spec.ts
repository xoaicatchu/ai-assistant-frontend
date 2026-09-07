import { describe, expect, it, vi } from 'vitest';
import { ChatRequestQueue } from './chat-request-queue';

describe('ChatRequestQueue', () => {
  it('drains requests in FIFO order and never runs workers concurrently', async () => {
    const queue = new ChatRequestQueue<string>();
    const order: string[] = [];
    let activeWorkers = 0;
    let peakWorkers = 0;
    let releaseFirst!: () => void;

    queue.enqueue('first');
    queue.enqueue('second');
    queue.enqueue('third');

    const drain = queue.run(async (item) => {
      activeWorkers += 1;
      peakWorkers = Math.max(peakWorkers, activeWorkers);
      order.push(`start:${item.payload}`);
      if (item.payload === 'first') {
        await new Promise<void>((resolve) => { releaseFirst = resolve; });
      }
      order.push(`end:${item.payload}`);
      activeWorkers -= 1;
    });

    await Promise.resolve();
    expect(order).toEqual(['start:first']);
    expect(queue.isRunning()).toBe(true);

    releaseFirst();
    await drain;

    expect(order).toEqual([
      'start:first', 'end:first',
      'start:second', 'end:second',
      'start:third', 'end:third',
    ]);
    expect(peakWorkers).toBe(1);
    expect(queue.isRunning()).toBe(false);
    expect(queue.snapshot()).toEqual([]);
  });

  it('continues with the next request when one worker fails', async () => {
    const queue = new ChatRequestQueue<number>();
    const handled: number[] = [];
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    await queue.run(async (item) => {
      handled.push(item.payload);
      if (item.payload === 1) {
        throw new Error('first failed');
      }
    });

    expect(handled).toEqual([1, 2, 3]);
  });

  it('removes a queued item without affecting the remaining order', async () => {
    const queue = new ChatRequestQueue<string>();
    const removed = queue.enqueue('remove me');
    queue.enqueue('keep me');

    expect(queue.remove(removed.id)).toBe(true);
    expect(queue.remove(removed.id)).toBe(false);
    expect(queue.snapshot().map((item) => item.payload)).toEqual(['keep me']);
  });

  it('does not start a second drain while one is already running', async () => {
    const queue = new ChatRequestQueue<string>();
    const worker = vi.fn(async () => {});
    queue.enqueue('one');

    const first = queue.run(worker);
    const second = queue.run(worker);
    await Promise.all([first, second]);

    expect(worker).toHaveBeenCalledOnce();
  });
});
