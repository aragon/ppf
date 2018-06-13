const express = require('express')
const PPF = require('@aragon/ppf.js')

module.exports = requestData => {
  const router = express.Router()

  router.use((req, res, next) => {
    req.env = req.query.env || 'mainnet'
    next()
  })

  router.get('/rates', (req, res, next) => {
    res.send(requestData(req.env))
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