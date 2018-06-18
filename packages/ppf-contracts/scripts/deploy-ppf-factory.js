const PPFFactory = artifacts.require('PPFFactory')

module.exports = async callback => {
  const ppfFactory = await PPFFactory.new()

  console.log(ppfFactory.address)
  callback()
}