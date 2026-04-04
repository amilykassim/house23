import { put, get } from "@vercel/blob"
import fs from "fs"
import path from "path"

/**
 * Set to true  → use Vercel Blob everywhere (local dev + production).
 * Set to false → use local filesystem in dev, Vercel Blob only on Vercel.
 */
const USE_BLOBS_LOCALLY = true

const isVercel = !!process.env.VERCEL
const useBlob = isVercel || USE_BLOBS_LOCALLY

// ── Blob helpers ──────────────────────────────────────────────

async function readBlob<T>(key: string): Promise<T | null> {
    try {
        const result = await get(key, {
            access: "private",
            token: process.env.BLOB_READ_WRITE_TOKEN,
            useCache: false, // always fetch fresh content, never 304
        })
        if (!result || !result.stream) {
            return null
        }

        const response = new Response(result.stream)
        const text = await response.text()
        return JSON.parse(text) as T
    } catch (error) {
        console.error(`[storage] readBlob error for "${key}":`, error)
        return null
    }
}

async function writeBlob<T>(key: string, data: T): Promise<void> {
    await put(key, JSON.stringify(data, null, 2), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        token: process.env.BLOB_READ_WRITE_TOKEN,
    })
}

// ── Local filesystem helpers ──────────────────────────────────

function readLocal<T>(filename: string): T | null {
    try {
        const filePath = path.join(process.cwd(), "data", filename)
        const raw = fs.readFileSync(filePath, "utf-8")
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

function writeLocal<T>(filename: string, data: T): void {
    const filePath = path.join(process.cwd(), "data", filename)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

// ── Public API ────────────────────────────────────────────────

/**
 * Read a JSON data file by name (e.g. "bookings.json")
 */
export async function readData<T>(filename: string, fallback: T): Promise<T> {
    if (useBlob) {
        const data = await readBlob<T>(filename)
        return data ?? fallback
    }
    return readLocal<T>(filename) ?? fallback
}

/**
 * Write a JSON data file by name (e.g. "bookings.json")
 */
export async function writeData<T>(filename: string, data: T): Promise<void> {
    if (useBlob) {
        await writeBlob(filename, data)
    } else {
        writeLocal(filename, data)
    }
}
