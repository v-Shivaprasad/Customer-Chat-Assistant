import { createClient, RedisClientType } from "redis";

export class ChatCache {
  private redis: RedisClientType;
  private readonly MAX_MESSAGES = 3;

  constructor() {
      const host = process.env.REDIS_HOST || "localhost";
      const port = process.env.REDIS_PORT || "6379";
      const password = process.env.REDIS_PASSWORD || "";

      const url = `redis://:${password}@${host}:${port}`;

      this.redis = createClient({ url });

      this.redis.on("error", (err) => {
        console.error("Redis error:", err);
      });
  }

  async connect() {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
  }

  private key(conversationId: string): string {
    return `chat:context:${conversationId}`;
  }

  async addMessage(
    conversationId: string,
    sender: "user" | "ai",
    text: string
  ): Promise<void> {
    await this.connect();

    const k = this.key(conversationId);

    await this.redis.rPush(
      k,
      JSON.stringify({ sender, text })
    );

    await this.redis.lTrim(k, -this.MAX_MESSAGES, -1);

    // expire in 300s (5 minutes)
    await this.redis.expire(k, 300);
  }

  async getContext(conversationId: string) {
    await this.connect();

    const data = await this.redis.lRange(this.key(conversationId), 0, -1);
    return data.map((d) => JSON.parse(d));
  }

  async clear(conversationId: string): Promise<void> {
    await this.connect();
    await this.redis.del(this.key(conversationId));
  }

  async close() {
    if (this.redis.isOpen) {
      await this.redis.quit();
    }
  }
}
