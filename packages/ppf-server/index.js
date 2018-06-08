const Fetcher = require('./fetcher')
const PPF = require('@aragon/ppf.js')

const config = require(process.env.CONFIG)

const MAINNET = 'mainnet'

const fetcherUpdate = (err, { base, quote, price }) => {
  console.log(`Got price for ${base}: ${price} ${quote}`)

  const getBaseToken = config.tokens[base] || config.tokens.default(base)
  const getQuoteToken = config.tokens[quote] || config.tokens.default(quote)
  const when = parseInt(+new Date()/1000)

  const call = PPF.computeUpdateCall(config.operatorKey, getBaseToken(MAINNET), getQuoteToken(MAINNET), price, when)
}

const fetcher = new Fetcher(config, fetcherUpdate)
fetcher.start()