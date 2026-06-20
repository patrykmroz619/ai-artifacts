import { defineCommand } from 'citty'
import { runInstall } from './install.js'

export default defineCommand({
  meta: {
    name: 'install',
    description: 'Install skills and rules from the registry into your project',
  },
  args: {
    dryRun: {
      type: 'boolean',
      description: 'Print intended writes without making changes',
    },
  },
  async run(ctx) {
    const scopes = ctx.args._ as string[]

    if (scopes.length === 0) {
      console.error(
        'Usage: npx @patryk.mroz/artifacts install <scope...> [--dry-run]\n\n' +
        'Arguments:\n' +
        '  scope     One or more domain folder names from the registry (e.g. coding-workflows)\n\n' +
        'Options:\n' +
        '  --dry-run  Print intended writes without making changes\n\n' +
        'Examples:\n' +
        '  npx @patryk.mroz/artifacts install coding-workflows\n' +
        '  npx @patryk.mroz/artifacts install coding-workflows learning --dry-run'
      )
      process.exit(1)
    }

    const { failed } = await runInstall({ scopes, dryRun: Boolean(ctx.args.dryRun) })

    if (failed.length > 0) {
      console.error(`Failed scopes: ${failed.join(', ')}`)
      process.exit(1)
    }
  },
})
