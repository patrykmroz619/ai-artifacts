#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8')) as {
  name?: string
  version?: string
  description?: string
}

const main = defineCommand({
  meta: {
    name: pkg.name ?? 'ai-artifacts',
    version: pkg.version ?? '0.0.0',
    description: pkg.description ?? '',
  },
  subCommands: {
    install: () => import('./commands/install/command.js').then(m => m.default),
  },
})

runMain(main)
