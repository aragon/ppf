const express = require('express')
const PPF = require('@aragon/ppf.js')

module.exports = requestData => {
  const router = express.Router()

  router.use((req, res, next) => {
    req.env = req.query.env || 'mainnet'
    next()
  })

  router.get('/rates', (req, res, next) => {
    let data = requestData(req.env)

    const bases = data.map(p => p.baseToken)
    const quotes = data.map(p => p.quoteToken)
    const prices = data.map(p => p.price)
    const whens = data.map(p => p.when)
    const sigs = data.map(p => p.sig)
    
    const calldata = PPF.encodeManyCall(bases, quotes, prices, whens, sigs)

    data.forEach(({ when }, i) => data[i].date = new Date(1000 * when))

    res.render('rates', {
      ppf: req.query.ppf || '0x',
      calldata,
      rates: data,
    })
  })
  
  router.get('/rate/:base/:quote', (req, res, next) => {
    const data = requestData(req.env, req.params.base, req.params.quote)
    if (!data) {
      return res.status(404).send('rate not processed')
    }

    const calldata = PPF.encodeCall(data.baseToken, data.quoteToken, data.price, data.when, data.sig)

    res.render('rate', {
      ppf: req.query.ppf || '0x',
      date: new Date(1000 * data.when),
      calldata,
      ...data,
    })
  })

  return router
}