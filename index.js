// dsh-deep-work — host half.
//
// The bundle patch declares the `deep-work` agent preset. This module's only
// job is to publish the `deep-work` skill into the shared skill catalog so the
// preset, and any other agent that asks for it, can load the workflow.

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const inject = ['skills']

const packageDir = dirname(fileURLToPath(import.meta.url))

function readSkill(dir) {
  const raw = readFileSync(join(dir, 'SKILL.md'), 'utf8')
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (match === null) throw new Error('SKILL.md is missing YAML frontmatter')

  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const divider = line.indexOf(':')
    if (divider > 0) meta[line.slice(0, divider).trim()] = line.slice(divider + 1).trim()
  }

  if (typeof meta.name !== 'string' || typeof meta.description !== 'string') {
    throw new Error('SKILL.md frontmatter requires name and description')
  }

  return {
    name: meta.name,
    description: meta.description,
    content: raw.slice(match[0].length),
    source: 'runtime',
    resourceBase: { kind: 'directory', path: dir },
  }
}

export function apply(ctx) {
  const dir = join(packageDir, 'skills', 'deep-work')
  try {
    return ctx.skills.register(readSkill(dir))
  } catch (error) {
    ctx.logger?.warn?.(`[deep-work] failed to register skill: ${error}`)
    return undefined
  }
}
