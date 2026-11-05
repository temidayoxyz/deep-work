// Deep Work verification tool.
//
// A model can claim a document was produced. This tool checks the file that
// actually exists on disk and reports its size and container signature. It is
// deliberately read-only: it never repairs or rewrites the deliverable.

export const inject = ['tools', 'fs', 'workingDirectory']

const KINDS = ['docx', 'xlsx', 'pptx', 'pdf', 'html', 'markdown', 'csv', 'json', 'text', 'any']

function extensionKind(path) {
  const ext = path.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1]
  if (ext === 'doc' || ext === 'docx') return 'docx'
  if (ext === 'xls' || ext === 'xlsx') return 'xlsx'
  if (ext === 'ppt' || ext === 'pptx') return 'pptx'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'html' || ext === 'htm') return 'html'
  if (ext === 'md' || ext === 'markdown') return 'markdown'
  if (ext === 'csv' || ext === 'tsv') return 'csv'
  if (ext === 'json') return 'json'
  return 'text'
}

function byteText(bytes) {
  return Array.from(bytes, byte => String.fromCharCode(byte)).join('')
}

function detectContainer(kind, bytes) {
  const head = byteText(bytes)
  if (kind === 'pdf') return head.startsWith('%PDF-') ? 'pdf' : 'unknown'
  if (kind === 'docx' || kind === 'xlsx' || kind === 'pptx') {
    return head.startsWith('PK\u0003\u0004') ? 'zip-office' : 'unknown'
  }
  if (kind === 'html') {
    const text = head.toLowerCase()
    return text.includes('<html') || text.includes('<!doctype html') ? 'html' : 'text'
  }
  if (kind === 'json') {
    const text = head.trimStart()
    return text.startsWith('{') || text.startsWith('[') ? 'json' : 'text'
  }
  return 'text'
}

function displaySize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`
}

export function inspectDeliverable(input, found) {
  const expected = input.expected ?? extensionKind(input.path)
  const kind = detectContainer(expected, found.head)
  const ok = found.bytes > 0 && (expected === 'any' || kind !== 'unknown')
  return {
    ok,
    path: input.path,
    bytes: found.bytes,
    kind,
    summary: ok
      ? `${input.path}: ${displaySize(found.bytes)} ${kind} container`
      : `${input.path}: ${found.bytes > 0 ? `unexpected ${kind} container` : 'file is empty'}`,
  }
}

export function registerVerifyTool(ctx) {
  return ctx.tools.register({
    name: 'verify_deliverable',
    description: 'Verify that a Deep Work deliverable exists and looks like the expected file type. Read-only: checks size and the file signature (PDF, Office ZIP, HTML, JSON) and returns a concise result.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Deliverable path, absolute or relative to the session workspace.' },
        expected: {
          type: 'string',
          enum: KINDS,
          description: 'Expected file kind. Defaults to the path extension.',
        },
      },
      required: ['path'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
          path: { type: 'string' },
          bytes: { type: 'number' },
          kind: { type: 'string' },
          summary: { type: 'string' },
        },
        required: ['ok', 'path', 'bytes', 'kind', 'summary'],
        additionalProperties: false,
      },
      render(_args, value) {
        return [{ type: 'text', text: value.summary }]
      },
    },
    async execute(args, exec) {
      if (typeof args?.path !== 'string' || args.path.length === 0) {
        throw new Error('path is required')
      }
      if (args.expected !== undefined && !KINDS.includes(args.expected)) {
        throw new Error(`expected must be one of: ${KINDS.join(', ')}`)
      }

      const cwd = exec.agent === undefined
        ? ctx.workingDirectory.defaultDirectory
        : await ctx.workingDirectory.ensure(exec.agent, exec.signal)
      const target = await ctx.fs.resolve(args.path, { cwd, signal: exec.signal })
      const info = await ctx.fs.stat(target, exec.signal)
      if (info === undefined) {
        return { ok: false, path: args.path, bytes: 0, kind: 'unknown', summary: `${args.path}: not found` }
      }
      if (info.type === 'directory') {
        return { ok: false, path: args.path, bytes: 0, kind: 'directory', summary: `${args.path}: is a directory` }
      }

      const head = await ctx.fs.readByteRange(target, { offset: 0, length: 64 }, exec.signal)
      return inspectDeliverable(args, { bytes: info.size ?? head.byteLength, head })
    },
  })
}

export function apply(ctx) {
  return registerVerifyTool(ctx)
}
