// Lets `node --test` load the app's TypeScript without a build step or new
// dependencies: .ts files are transpiled with the project's own `typescript`,
// `@/` resolves to the repo root, and `resend` is swapped for a fake that
// records what would have been sent (see fakeResend below).
const Module = require("module")
const path = require("path")
const fs = require("fs")
const ts = require("typescript")

const ROOT = path.resolve(__dirname, "../..")

const fakeResend = {
    // Every call to emails.send, and the ones Resend accepted
    attempts: [],
    sent: [],
    // The second argument of each send call (e.g. { idempotencyKey })
    options: [],
    // Set to { error } or { throws } to make the next call fail
    next: null,
    reset() {
        this.attempts = []
        this.sent = []
        this.options = []
        this.next = null
    },
}
globalThis.__fakeResend = fakeResend

class Resend {
    constructor(key) {
        this.key = key
        this.emails = {
            send: async (payload, options) => {
                const next = fakeResend.next
                fakeResend.next = null
                fakeResend.attempts.push(payload)
                fakeResend.options.push(options)
                if (next && next.throws) throw new Error(next.throws)
                if (next && next.error) return { data: null, error: next.error }
                fakeResend.sent.push(payload)
                return { data: { id: `fake_${fakeResend.sent.length}` }, error: null }
            },
        }
    }
}

const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, ...rest) {
    if (request === "resend") return "fake:resend"
    if (request.startsWith("@/")) {
        const base = path.join(ROOT, request.slice(2))
        for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
        }
    }
    return originalResolve.call(this, request, parent, ...rest)
}

const originalLoad = Module._load
Module._load = function (request, parent, ...rest) {
    if (request === "resend") return { Resend }
    return originalLoad.call(this, request, parent, ...rest)
}

require.extensions[".ts"] = function (module, filename) {
    const source = fs.readFileSync(filename, "utf8")
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
        },
        fileName: filename,
    })
    module._compile(outputText, filename)
}

module.exports = { fakeResend, ROOT }
