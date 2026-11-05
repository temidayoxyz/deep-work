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

test('client apply registers a locale and three Deep Work actions', async () => {
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
  }
  const module = capture.factory(name => {
    if (name === 'react') return React
    throw new Error(`unexpected require: ${name}`)
  })

  const effects = []
  const slots = []
  const locales = []
  const context = {
    effect(create, label) {
      effects.push(label)
      const dispose = create()
      return dispose
    },
    locale: {
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
    uiWorkspace: { startSession() {} },
  }

  assert.deepEqual(module.inject, ['slots', 'locale', 'uiWorkspace'])
  module.apply(context)
  assert.equal(locales.length, 1)
  assert.equal(locales[0].ns, 'deepWork')
  assert.equal(slots.length, 3)
  assert.deepEqual(slots.map(slot => slot.name), [
    'sidebar.footer.action',
    'conversation.hero.options',
    'conversation.session.header.actions',
  ])
})
