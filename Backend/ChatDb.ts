import { Pool } from "pg";

export class CHATDB {
  private pool: Pool;

   constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } 
    });
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY,
        conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
        sender VARCHAR(10) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  async createConversation(id: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO conversations (id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [id]
    );
  }

  async saveMessage(
    id: string,
    conversationId: string,
    sender: "user" | "ai",
    text: string
    ): Promise<void> {
    await this.pool.query(
      `INSERT INTO messages (id, conversation_id, sender, text)
       VALUES ($1, $2, $3, $4)`,
      [id, conversationId, sender, text]
    );
  }

  async getMessages(conversationId: string) {
    const res = await this.pool.query(
      `SELECT sender, text
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );
    return res.rows;
  }
}
