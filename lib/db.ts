import { Pool, types } from "pg"

// DATE columns come back as "yyyy-MM-dd" strings, the format used across the app
types.setTypeParser(types.builtins.DATE, (value) => value)

/** Anything that can run a query: the shared pool, or a transaction. */
export interface Db {
    query(text: string, params?: unknown[]): Promise<{ rows: any[]; rowCount: number | null }>
}

// Reuse one pool across hot reloads in dev and across invocations on Vercel
const globalForDb = globalThis as unknown as { pgPool?: Pool }

function getPool(): Pool {
    if (!globalForDb.pgPool) {
        const connectionString = process.env.DATABASE_URL
        if (!connectionString) {
            throw new Error("DATABASE_URL is not set (the Neon connection string)")
        }
        const pool = new Pool({ connectionString, max: 5 })
        // An idle connection dropped by the server must not crash the process
        pool.on("error", (error) => console.error("[db] idle client error:", error))
        globalForDb.pgPool = pool
    }
    return globalForDb.pgPool
}

export const db: Db = {
    query: (text, params) => getPool().query(text, params),
}

/** Run `fn` in one transaction: every write in it lands, or none does. */
export async function transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
    const client = await getPool().connect()
    try {
        await client.query("BEGIN")
        const result = await fn(client)
        await client.query("COMMIT")
        return result
    } catch (error) {
        await client.query("ROLLBACK").catch(() => { })
        throw error
    } finally {
        client.release()
    }
}
