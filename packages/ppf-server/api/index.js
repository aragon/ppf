const express = require('express')

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
    res.send(requestData(req.env, req.params.base, req.params.quote))
  })

  return router
}