import { Injectable } from '@nestjs/common';

interface CachedResponse {
  data: unknown;
  expiresAt: number;
}

@Injectable()
export class IdempotencyService {
  private readonly store = new Map<string, CachedResponse>();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  get(key: string): unknown | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: unknown): void {
    this.store.set(key, { data, expiresAt: Date.now() + this.TTL_MS });
  }
}
