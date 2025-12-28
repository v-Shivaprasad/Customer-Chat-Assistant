import { createClient, RedisClientType } from "redis";

export class ChatCache {
  private redis: RedisClientType;
  private readonly DEFAULT_TURNS = 3;

  constructor() {
    const username = process.env.REDIS_USERNAME || "default";
    const password = process.env.REDIS_PASSWORD!;
    const host =
      process.env.REDIS_HOST ||
      "redis-19527.c264.ap-south-1-1.ec2.cloud.redislabs.com";
    const port = +(process.env.REDIS_PORT || 19527);

    this.redis = createClient({
      username,
      password,
      socket: {
        host,
        port,
        // tls: true // enable if your instance requires TLS
      },
    });

    this.redis.on("error", (err) =>
      console.error("Redis error:", err)
    );
  }

  async connect() {
    if (!this.redis.isOpen) await this.redis.connect();
  }

  private key(conversationId: string) {
    return `chat:context:${conversationId}`;
  }

  async addMessage(
    conversationId: string,
    sender: "user" | "ai",
    text: string
  ) {
    await this.connect();
    const k = this.key(conversationId);

    await this.redis.rPush(k, JSON.stringify({ sender, text }));

    // keep TTL (no trimming here!)
    await this.redis.expire(k, 300);
  }

  async trim(conversationId: string, turns = this.DEFAULT_TURNS) {
    await this.connect();
    const k = this.key(conversationId);

    // keep last N full user+ai pairs
    await this.redis.lTrim(k, -(turns * 2), -1);
  }

  async getContext(conversationId: string) {
    await this.connect();
    const data = await this.redis.lRange(this.key(conversationId), 0, -1);
    return data.map((d) => JSON.parse(d));
  }

  async clear(conversationId: string) {
    await this.connect();
    await this.redis.del(this.key(conversationId));
  }

  async close() {
    if (this.redis.isOpen) await this.redis.quit();
  }
}
