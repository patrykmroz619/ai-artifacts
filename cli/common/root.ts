import { defineCommand } from 'citty'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
  name?: string
  version?: string
  description?: string
}

export const subCommands = {
  install: () => import('../commands/install/command.js').then(m => m.default),
  list: () => import('../commands/list/command.js').then(m => m.default),
  help: () => import('../commands/help/command.js').then(m => m.default),
}

export const rootCmd = defineCommand({
  meta: {
    name: pkg.name ?? 'ai-artifacts',
    version: pkg.version ?? '0.0.0',
    description: pkg.description ?? '',
  },
  subCommands,
})
