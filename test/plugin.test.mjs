import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

test('package manifest declares the bundle and client halves', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(manifest.name, 'dsh-deep-work')
  assert.equal(manifest.type, 'module')
  assert.equal(manifest.exports['.'], './index.js')
  assert.equal(manifest.exports['./client'], './client.js')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.client.platform, 'web')
  assert.equal(manifest.dsh.client.immediately, true)
})

test('bundle patch declares the deep-work preset', () => {
  const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')
  assert.match(patch, /id:\s*preset-deep-work/)
  assert.match(patch, /id:\s*deep-work\n\s+name: Deep Work/)
  assert.match(patch, /agentPreset|dsh-agent-preset/)
  assert.match(patch, /name: dsh-deep-work/)
})

test('host apply registers the deep-work skill', async () => {
  const module = await import(pathToFileURL(join(root, 'index.js')).href)
  const registered = []
  const context = {
    skills: {
      register(skill) {
        registered.push(skill)
        return () => {}
      },
    },
    inject() {},
    logger: { warn() {} },
  }
  module.apply(context)
  assert.equal(registered.length, 1)
  assert.equal(registered[0].name, 'deep-work')
  assert.match(registered[0].description, /operating protocol/i)
  assert.ok(registered[0].content.length > 1000)
  assert.equal(registered[0].source, 'runtime')
  assert.equal(registered[0].resourceBase.kind, 'directory')
})

test('client apply registers the Deep Work tab, title, and header badge', async () => {
  let capture
  globalThis.window = {
    __ModuleLoader__: {
      load(definition) {
        capture = definition
      },
    },
  }

  await import(pathToFileURL(join(root, 'client.js')).href)
  assert.ok(capture, 'client module should register with the module loader')
  assert.equal(capture.id, 'dsh-deep-work')

  const React = {
    createElement() {},
    useState(value) { return [value, () => {}] },
    useCallback(fn) { return fn },
    useEffect() {},
  }
  const module = capture.factory(name => {
    if (name === 'react') return React
    throw new Error(`unexpected require: ${name}`)
  })

  const slots = []
  const locales = []
  const tabTypes = []
  const context = {
    effect(create) { return create() },
    locale: {
      bind() { return key => key },
      register(ns, dicts) {
        locales.push({ ns, dicts })
        return () => {}
      },
    },
    slots: {
      inject(name, create) {
        slots.push({ name, create })
        return () => {}
      },
    },
    sidebarRightTabs: {
      register(definition) {
        tabTypes.push(definition)
        return () => {}
      },
    },
    sidebarRight: { openResource() {} },
    remote: { workspaceFiles: {} },
  }

  assert.deepEqual(module.inject, ['slots', 'locale', 'sidebarRightTabs', 'sidebarRight', 'remote'])
  module.apply(context)
  assert.equal(locales.length, 1)
  assert.equal(locales[0].ns, 'deepWork')
  assert.equal(tabTypes.length, 1)
  assert.equal(tabTypes[0].id, 'dsh-deep-work/cockpit')
  assert.deepEqual(tabTypes[0].patterns, ['dsh-resource://deep-work/**'])
  assert.equal(slots.length, 3)
  assert.deepEqual(slots.map(slot => slot.name), [
    'sidebar.right.pane.tab',
    'sidebar.right.pane.tab.title',
    'conversation.session.header.actions',
  ])
})

test('deliverable detection recognises office, pdf, html, and empty files', async () => {
  const module = await import(pathToFileURL(join(root, 'verify.js')).href)

  const bytes = text => new TextEncoder().encode(text)
  const docx = module.inspectDeliverable(
    { path: 'deliverables/report.docx' },
    { bytes: 2048, head: bytes('PK\u0003\u0004rest') },
  )
  assert.equal(docx.ok, true)
  assert.equal(docx.kind, 'zip-office')

  const pdf = module.inspectDeliverable(
    { path: 'deliverables/report.pdf' },
    { bytes: 2048, head: bytes('%PDF-1.7') },
  )
  assert.equal(pdf.ok, true)
  assert.equal(pdf.kind, 'pdf')

  const html = module.inspectDeliverable(
    { path: 'deliverables/page.html' },
    { bytes: 512, head: bytes('<!doctype html><html>') },
  )
  assert.equal(html.ok, true)
  assert.equal(html.kind, 'html')

  const empty = module.inspectDeliverable(
    { path: 'deliverables/empty.pdf' },
    { bytes: 0, head: new Uint8Array() },
  )
  assert.equal(empty.ok, false)
  assert.match(empty.summary, /empty/)
})

test('verify tool registers and inspects a deliverable without writing', async () => {
  const module = await import(pathToFileURL(join(root, 'verify.js')).href)
  let definition
  const context = {
    workingDirectory: { defaultDirectory: root },
    fs: {
      async resolve(path, options) {
        assert.equal(options.cwd, root)
        return { path }
      },
      async stat() {
        return { type: 'file', size: 42 }
      },
      async readByteRange() {
        return new TextEncoder().encode('%PDF-1.7')
      },
    },
    tools: {
      register(value) {
        definition = value
        return () => {}
      },
    },
  }

  module.registerVerifyTool(context)
  assert.equal(definition.name, 'verify_deliverable')
  assert.deepEqual(definition.parameters.required, ['path'])

  const result = await definition.execute(
    { path: 'deliverables/report.pdf' },
    { agent: undefined, signal: new AbortController().signal },
  )
  assert.equal(result.ok, true)
  assert.equal(result.kind, 'pdf')
  assert.equal(result.bytes, 42)
})

