const sigs = require('eth-sig-util')
const { soliditySha3 } = require('web3-utils')
const BigNumber = require('bignumber.js')
const abi = require('web3-eth-abi')

const ppfABI = require('@aragon/ppf-contracts/build/contracts/PPF').abi
const updateFunction = ppfABI.find(x => x.name == 'update' && x.type == 'function')

const HASH_ID = soliditySha3({ t: 'string', v: 'PPF-v1' })
const ONE = new BigNumber(10).pow(18)
const formatRate = n => new BigNumber(n.toFixed(18)).times(ONE)
const parseRate = x => x.div(ONE).toNumber().toFixed(4)

const updateHash = (base, quote, xrt, when) => {
  return soliditySha3(
    { t: 'bytes32', v: HASH_ID },
    { t: 'address', v: base },
    { t: 'address', v: quote },
    { t: 'uint128', v: xrt },
    { t: 'uint64', v: when }
  )
}

const signUpdate = (pk, base, quote, xrt, when) => { 
  pk = pk.replace('0x', '') // remove 0x if present
  const keyBuffer = Buffer.from(pk, 'hex')
  const data = updateHash(base, quote, formatRate(xrt), when)
  return sigs.personalSign(keyBuffer, { data })
}

const encodeCall = (base, quote, xrt, when, sig) => {
  const params = [ base, quote, formatRate(xrt), when, sig ]
  return abi.encodeFunctionCall(updateFunction, params)
}

const computeUpdateCall = (pk, base, quote, xrt, when) => {
  const sig = signUpdate(pk, base, quote, xrt, when)
  return encodeCall(base, quote, xrt, when, sig)
}

module.exports = {
  HASH_ID,
  ONE,
  formatRate,
  parseRate,
  updateHash,
  signUpdate,
  computeUpdateCall,
}
