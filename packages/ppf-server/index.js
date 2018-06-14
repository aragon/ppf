const express = require('express')
const exphbs = require('express-handlebars')

const Fetcher = require('./fetcher')
const API = require('./api')
const Web = require('./web')
const PPF = require('@aragon/ppf.js')

const app = express()
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars')

const config = require(process.env.CONFIG)

const MAINNET = 'mainnet'

let db = {}

config.envs.forEach((env) => {
  db[env] = {}
})

const pairId = (base, quote) => `${base}:${quote}`

const fetcherUpdate = (err, { base, quote, price }) => {
  console.log(`Got price for ${base}: ${price} ${quote}`)

  const getBaseToken = config.tokens[base] || config.tokens.default(base)
  const getQuoteToken = config.tokens[quote] || config.tokens.default(quote)

  const when = parseInt(+new Date()/1000)

  config.envs.forEach((env) => {
    const baseToken = getBaseToken(env)
    const quoteToken = getQuoteToken(env)
    const sig = PPF.signUpdateHash(config.operatorKey, baseToken, quoteToken, when, price)

    db[env][pairId(base, quote)] = { base, quote, baseToken, quoteToken, when, price, sig }
  })
}

const requestData = (env, base, quote) => {
  if (!base || !quote) {
    return Object.values(db[env])
  } else {
    return db[env][pairId(base, quote)]
  }
}

const fetcher = new Fetcher(config, fetcherUpdate)
fetcher.start()

const api = API(requestData) 
app.use('/api', api)

const web = Web(config, requestData)
app.use(web)

const port = process.env.PORT || 3000
app.listen(port, (err) => {
  if (err) return console.error(err)
  console.log('Listening on port', port)
})