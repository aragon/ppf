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
  operatorKey: n => 'b9694bb642e9721b2d5ed112a9114ff32f07f15b4a3b10a4e1651e9542c6fe2f',
  defaultPPF: n => n === 'mainnet' ? '0x0000000000000000000000000000000000000000' : '0xe2479f674af8713b0a2030902b628bbed49e907a',
  envs: [ 'mainnet', 'rinkeby' ],
  pairs: [
    {
      base: 'ANT',
      quote: 'CHF',
      services: cryptoServicesConfig,
      ...standardConfig,
    },
    {
      base: 'ETH',
      quote: 'CHF',
      services: cryptoServicesConfig,
      ...standardConfig,
    },
    {
      base: 'DAI',
      quote: 'CHF',
      services: cryptoServicesConfig,
      ...standardConfig,
    },
    /*
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
    */
  ],
  tokens: {
    ANT: n => n === 'mainnet' ? '0x960b236A07cf122663c4303350609A66A7B288C0' : '0x0D5263B7969144a852D58505602f630f9b20239D',
    ETH: () => '0x0000000000000000000000000000000000000000',
    DAI: n => n === 'mainnet' ? '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359' : '0x0527e400502d0cb4f214dd0d2f2a323fc88ff924',
  }
}
