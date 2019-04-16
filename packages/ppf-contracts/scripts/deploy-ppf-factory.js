const logDeploy = require('@aragon/os/scripts/helpers/deploy-logger')

const globalArtifacts = this.artifacts // Not injected unless called directly via truffle

module.exports = async (
  truffleExecCallback,
  {
    artifacts = globalArtifacts
  } = {}
) => {
  const PPFFactory = artifacts.require('PPFFactory')

  const ppfFactory = await PPFFactory.new()

  await logDeploy(ppfFactory)

  if (typeof truffleExecCallback === 'function') {
    // Called directly via `truffle exec`
    truffleExecCallback()
  } else {
    return {
      ppfFactory
    }
  }
}