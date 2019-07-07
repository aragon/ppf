const { promisify: p } = require('util')
const request = p(require('request'))

const FOREX_API_BASE = 'http://free.currencyconverterapi.com/api/v5'

const pairFor = (base, quote) => `${base}_${quote}`
const getPriceURL = (pair) =>
  `${FOREX_API_BASE}/convert?q=${pair}&compact=y`

module.exports = class FOREX {
  async getPrice(base, quote) {
    const pair = pairFor(base, quote)
    const { statusCode, body } = await request(getPriceURL(pair))

    let parsed
    try {
      parsed = JSON.parse(body)
    } catch (e) {
      throw new Error(`FOREX cannot parse JSON ${statusCode} ${e.description}`)
    }

    if (Object.keys(parsed).length == 0) {
      throw new Error(`FOREX error (${statusCode}): no error data returned`)
    }

    return parsed[pair].val
  }
}
