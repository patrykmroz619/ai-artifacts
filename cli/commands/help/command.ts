import { defineCommand, showUsage, type CommandDef, type ArgsDef } from 'citty'
import { rootCmd, subCommands } from '../../common/root.js'

export default defineCommand({
  meta: {
    name: 'help',
    description: 'Show usage for the CLI or a specific command',
  },
  async run(ctx) {
    const commandName = ctx.args._[0] as string | undefined
    if (!commandName) {
      await showUsage(rootCmd)
      return
    }
    const loader = subCommands[commandName as keyof typeof subCommands]
    if (!loader) {
      const valid = Object.keys(subCommands).join(', ')
      console.error(`Unknown command: "${commandName}". Valid commands: ${valid}`)
      process.exitCode = 1
    }
    const subCmd = await loader() as CommandDef<ArgsDef>
    await showUsage(subCmd, rootCmd as CommandDef<ArgsDef>)
  },
})
