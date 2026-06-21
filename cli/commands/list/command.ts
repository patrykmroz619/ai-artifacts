import { defineCommand } from 'citty'
import { runList } from './list.js'

export default defineCommand({
  meta: {
    name: 'list',
    description: 'List registry scopes, or skills within a scope',
  },
  async run(ctx) {
    const scope = ctx.args._[0] as string | undefined
    const result = await runList({ scope })
    if (!result.ok) {
      process.exitCode = 1
    }
  },
})
