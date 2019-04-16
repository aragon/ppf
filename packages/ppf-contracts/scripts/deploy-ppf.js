const deployFactory = require('./deploy-ppf-factory')

module.exports = async (
  truffleExecCallback,
  {
    ppfFactoryAddress = process.env.PPF_FACTORY,
    operator = process.env.OPERATOR,
    operatorOwner = process.env.OPERATOR_OWNER
  } = {}
) => {
  if (!operator) {
    throw new Error('Missing operator address')
  }

  if (!operatorOwner) {
    throw new Error('Missing operator owner address')
  }

  const PPFFactory = artifacts.require('PPFFactory')
  
  const ppfFactory = ppfFactoryAddress
    ? PPFFactory.at(ppfFactoryAddress)
    : (await deployFactory(null, { artifacts })).ppfFactory

  console.log(`Using factory ${ppfFactory.address}`)
  console.log(`Deploying with operator ${operator} and operatorOwner ${operatorOwner}`)

  const { logs } = await ppfFactory.newPPF(operator, operatorOwner)
  const { ppf } = logs.find(({ event }) => event === 'NewPPF').args

  console.log(`PPF instance: ${ppf}`)

  truffleExecCallback()
}