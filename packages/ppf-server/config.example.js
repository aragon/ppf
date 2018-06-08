const tokenFromTicker = require('./helpers/tokenFromTicker')

const standardConfig = {
  requiredWeight: 1,      // Proportion of the weight that needs to be updated to produce a value [0, 1]
  allowedDisparity: 0.04, // Allowed disparity between services data [0, 1]
  returnTimeout: 1,         // Seconds that the fetcher waits after a value is pulled before reducing all state and generating signature
  magnitude: 0,           // Difference in magnitude between base and quote (+x means base is expressed in x orders of magnitude more than quote) 
}

const cryptoServicesConfig = [
  {
    service: 'cmc',
    refresh: 60,       // seconds that pass between fetches
    weight: 0.4,       // How much weight this service has in the average
    expiry: 60 * 60,   // seconds that will cause the service to be marked as unavailable 
  },
  {
    service: 'cc',
    refresh: 30,    
    weight: 0.6,     
    expiry: 60 * 60,
  },
]

const fiatServicesConfig = [
  {
    service: 'forex',
    refresh: 10 * 60,
    weight: 1,
    expiry: 3 * 60 * 60
  }
]

module.exports = {
  operatorKey: 'b9694bb642e9721b2d5ed112a9114ff32f07f15b4a3b10a4e1651e9542c6fe2f',
  pairs: [
    {
      base: 'ANT',
      quote: 'USD',
      services: cryptoServicesConfig,
      ...standardConfig,
    },
    {
      base: 'ETH',
      quote: 'USD',
      services: cryptoServicesConfig,
      ...standardConfig,
    },
    {
      base: 'CHF',
      quote: 'USD',
      services: fiatServicesConfig,
      ...standardConfig,
    },
    {
      base: 'EUR',
      quote: 'USD',
      services: fiatServicesConfig,
      ...standardConfig,
    },
  ],
  tokens: {
    ANT: n => n == 'mainnet' ? '0x960b236A07cf122663c4303350609A66A7B288C0' : '0x0D5263B7969144a852D58505602f630f9b20239D',
    ETH: () => '0x0000000000000000000000000000000000000000',
    default: ticker => () => tokenFromTicker(ticker),
  }
}
