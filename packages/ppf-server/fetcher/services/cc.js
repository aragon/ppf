const { promisify: p } = require('util')
const request = p(require('request'))

const CC_API_BASE = 'https://min-api.cryptocompare.com/data'

const getPriceURL = (base, quote) =>
  `${CC_API_BASE}/price?fsym=${base}&tsyms=${quote}`

module.exports = class CC {
  async getPrice(base, quote) {
    const { statusCode, body } = await request(getPriceURL(base, quote))

    let parsed
    try {
      parsed = JSON.parse(body)
    } catch (e) {
      throw new Error(`CC cannot parse JSON ${statusCode} ${e.description}`)
    }

    if (parsed.Response == 'Error') {
      throw new Error(`CC error (${statusCode}): ${parsed.Message || 'no error data returned'}`)
    }

    return parsed[quote]
  }
}
