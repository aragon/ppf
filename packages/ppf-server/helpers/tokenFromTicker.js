const { toChecksumAddress } = require('web3-utils')

const FILL_CHAR = Math.pow(2, 8) - 1
const ADDR_LENGTH = 20

const arrayOfSize = size => Array.from(Array(size).keys())

const tokenFromTicker = ticker => {
  const idChars = Math.min(ticker.length, ADDR_LENGTH)
  const tickerId = arrayOfSize(idChars).map((_, i) => FILL_CHAR - (ticker.charCodeAt(i) || 0))
  const fill = arrayOfSize(ADDR_LENGTH - idChars).map(() => FILL_CHAR)
  const addrBytes = Buffer.from(fill.concat(tickerId))

  return toChecksumAddress(addrBytes.toString('hex'))
}

module.exports = tokenFromTicker