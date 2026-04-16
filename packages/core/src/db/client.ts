import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ruleReferences } from './schemas/rule-reference';
import { rules } from './schemas/rule';

class Database {
  private static instance: Database;
  public db: ReturnType<typeof drizzle> | null = null;
  private pool: Pool | null = null;

  static getInstance(): Database {
    return Database.instance;
  }

  async initialize(): Promise<ReturnType<typeof drizzle>> {
    if (this.db) return this.db;

    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({ connectionString });

    try {
      await this.pool.query('SELECT 1');
      console.log('Database connected successfully.');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }

    const schema = {
      rules,
      ruleReferences,
    };
    this.db = drizzle(this.pool, { schema });

    return this.db;
  }
}

export const dbInstance = Database.getInstance();
export function getDb(): ReturnType<typeof drizzle> {
  if (dbInstance.db === null) {
    throw new Error();
  }
  return dbInstance.db;
}
