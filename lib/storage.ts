import { put, list } from "@vercel/blob"
import fs from "fs"
import path from "path"

const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN

/**
 * Storage abstraction layer.
 * - Local dev: reads/writes JSON files in data/ directory (unchanged behavior)
 * - Vercel production: uses Vercel Blob storage (read-only filesystem workaround)
 */

async function readBlob<T>(key: string): Promise<T | null> {
    const { blobs } = await list({ prefix: key })
    if (blobs.length === 0) return null
    const response = await fetch(blobs[0].url, { cache: "no-store" })
    if (!response.ok) return null
    return response.json() as Promise<T>
}

async function writeBlob<T>(key: string, data: T): Promise<void> {
    await put(key, JSON.stringify(data, null, 2), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
    })
}

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

/**
 * Read a JSON data file by name (e.g. "bookings.json")
 */
export async function readData<T>(filename: string, fallback: T): Promise<T> {
    if (isVercel) {
        const data = await readBlob<T>(filename)
        return data ?? fallback
    }
    return readLocal<T>(filename) ?? fallback
}

/**
 * Write a JSON data file by name (e.g. "bookings.json")
 */
export async function writeData<T>(filename: string, data: T): Promise<void> {
    if (isVercel) {
        await writeBlob(filename, data)
    } else {
        writeLocal(filename, data)
    }
}
