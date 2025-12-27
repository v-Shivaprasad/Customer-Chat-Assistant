import Redis from "ioredis";

export class ChatCache {
  private redis: Redis;
  private readonly MAX_MESSAGES = 3;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: 6379,
    });
  }

  private key(conversationId: string): string {
    return `chat:context:${conversationId}`;
  }

  async addMessage(
    conversationId: string,
    sender: "user" | "ai",
    text: string
  ): Promise<void> {
    const k = this.key(conversationId);

    await this.redis.rpush(
      k,
      JSON.stringify({ sender, text })
    );

    await this.redis.ltrim(k, -this.MAX_MESSAGES, -1);
    await this.redis.expire(k, 300);
  }

  async getContext(conversationId: string) {
    const data = await this.redis.lrange(this.key(conversationId), 0, -1);
    return data.map(d => JSON.parse(d));
  }

  async clear(conversationId: string): Promise<void> {
    await this.redis.del(this.key(conversationId));
  }
}
