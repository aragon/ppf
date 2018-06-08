const TIMEOUT = 3000 // ms

class Fetcher {
  constructor({ pairs }, callback) {
    this.pairs = pairs
    this.callback = callback

    this.services = this._initServices(this.pairs.map(p => p.services))

    this.state = {}
  }

  _initServices(allServices) {
    const flattenedServices = allServices.reduce((acc, ss) => acc.concat(ss), [])
    const uniqueServices = Array.from(new Set(flattenedServices.map(({ service }) => service)))

    const init = s => new s()
    return uniqueServices.reduce((acc, s) => Object.assign({[s]: init(require(`./services/${s}`)) }, acc), {})
  }

  start() {
   this.pairs.forEach(pair => this._startPair(pair))
  }

  async _startPair({ base, quote, services, requiredWeight, allowedDisparity, returnTimeout }) {
    let accWeight = 0

    const pair = this._pairId(base, quote)

    let pairState = { intervals: [], servicesState: {}, processTimeout: null, requiredWeight, allowedDisparity }

    services.forEach(({ service: serviceName, refresh, expiry, weight }) => {
      const int = setInterval(() => {
        this._getService(base, quote, serviceName, expiry, returnTimeout)
      }, refresh * 1000)

      // Get initial values on boot
      this._getService(base, quote, serviceName, expiry, returnTimeout)

      accWeight += weight
      pairState.servicesState[serviceName] = { weight }
      pairState.intervals.push(int)
    })

    if (accWeight != 1) {
      console.error(`Weights dont sum to 1 for ${base} ${quote}`)
      pairState.intervals.forEach(i => i.invalidate())
    }

    this.state[pair] = pairState
  }

  async _getService(base, quote, serviceName, expiry, returnTimeout) {
    const pair = this._pairId(base, quote)
    console.log(`${serviceName}: getting ${pair}`)

    const zeroOnTimeout = t => new Promise((resolve) => setTimeout(resolve, t, 0)) 

    let price = 0
    try {
      price = await Promise.race([
        this.services[serviceName].getPrice(base, quote),
        zeroOnTimeout(TIMEOUT)
      ])
    } catch (e) {
      console.error(`Fetch ${serviceName} for ${base}:${quote} failed ${e.description}`)
      return 0
    }

    if (price == 0) {
      console.error(`${serviceName} timeout for ${base}:${quote}`)
    } else {
      console.log(`${serviceName} ${pair}: ${price} ${quote}`)

      this.state[pair].servicesState[serviceName].price = price
      this.state[pair].servicesState[serviceName].expiry = expiry + this._time()

      clearTimeout(this.state[pair].processTimeout)
      this.state[pair].processTimeout = setTimeout(() => this._processPair(base, quote), returnTimeout * 1000)
    }
  }

  _processPair(base, quote) {
    const pairState = this.state[this._pairId(base, quote)]

    const servicesState = Object.values(pairState.servicesState)
    const updatedServices = servicesState.filter(({ expiry } ) => this._time() < expiry)
    const updatedWeight = updatedServices.reduce((acc, { weight }) => acc + weight, 0)

    if (updatedWeight < pairState.requiredWeight) {
      console.log(`Processing ${base} ${quote}, cannot process price, insuficient weight ${updatedWeight}/${pairState.requiredWeight}`)
    } else {
      const price = updatedServices.reduce((acc, { price, weight }) => acc + price * weight, 0)
      const weightedPrice = price / updatedWeight 

      this.callback(null, { price: weightedPrice, base, quote })
    }
  }

  _pairId(base, quote) {
    return `${base}:${quote}`
  }

  _priceId(base, quote, serviceName) {
    return `${serviceName}-${this._pairId(base, quote)}`
  }

  _time() {
    return +new Date()/1000
  }
}

module.exports = Fetcher