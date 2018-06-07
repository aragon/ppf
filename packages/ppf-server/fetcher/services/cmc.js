const { promisify: p } = require('util')
const request = p(require('request'))

const CMC_API_BASE = 'https://api.coinmarketcap.com/v2/ticker'
const LOAD_IDS = 300
const ID_LIMIT = 100

const getTickersURL = (start) =>
  `${CMC_API_BASE}?start=${start}&limit=${ID_LIMIT}`

const getPriceURL = (base, quote) =>
  `${CMC_API_BASE}/${base}/?convert=${quote}`

const requestTickers = async (start) => {
  const { statusCode, body } = await request(getTickersURL(start))

  let parsed
  try {
    parsed = JSON.parse(body)
  } catch (e) {
    throw new Error(`CMC cannot parse JSON ${statusCode} ${e.description}`)
  }

  if (!parsed.data) {
    throw new Error(`CMC error (${statusCode}): ${parsed.metadata.error || 'no error data returned'}`)
  }

  return Object.values(parsed.data)
}

module.exports = class CMC {
  constructor(ids = {}, loadIds = LOAD_IDS, limit = ID_LIMIT) {
    if (Object.keys(ids).length > 0) {
      this._ids = ids
    }

    this.loadIds = loadIds
    this.limit = limit
  }

  async getTickers(loadIds, limit) {
    const n = Math.max(Math.ceil(loadIds / limit), 1)
    const trenches = Array.from(Array(n).keys())

    const tickers = await Promise.all(trenches.map((_, i) => requestTickers(limit * i)))
    const flatTickers = tickers.reduce((acc, t) => acc.concat(t), [])
    return flatTickers.reduce((acc, { symbol, id }) => Object.assign({ [symbol]: id }, acc), {})
  }

  async getPrice(base, quote) {
    if (!this._ids) {
      this._ids = await this.getTickers(this.loadIds, this.limit)
    }

    const baseId = this._ids[base] || base
    const { statusCode, body } = await request(getPriceURL(baseId, quote))

    let parsed
    try {
      parsed = JSON.parse(body)
    } catch (e) {
      throw new Error(`CMC cannot parse JSON ${statusCode} ${e.description}`)
    }

    if (!parsed.data) {
      throw new Error(`CMC error (${statusCode}): ${parsed.metadata.error || 'no error data returned'}`)
    }

    return parsed.data.quotes[quote].price
  }
}
