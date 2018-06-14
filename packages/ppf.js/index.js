const sigs = require('eth-sig-util')
const { soliditySha3 } = require('web3-utils')
const BigNumber = require('bignumber.js')
const abi = require('web3-eth-abi')

const ppfABI = require('@aragon/ppf-contracts/build/contracts/PPF').abi
const updateFunction = ppfABI.find(x => x.name == 'update' && x.type == 'function')
const updateManyFunction = ppfABI.find(x => x.name == 'updateMany' && x.type == 'function')

const HASH_ID = soliditySha3({ t: 'string', v: 'PPF-v1' })
const ONE = new BigNumber(10).pow(18)
const formatRate = n => new BigNumber(n.toFixed(18)).times(ONE)
const parseRate = x => x.div(ONE).toNumber().toFixed(4)

const updateDataHash = (base, quote, xrt, when) => {
  return soliditySha3(
    { t: 'bytes32', v: HASH_ID },
    { t: 'address', v: base },
    { t: 'address', v: quote },
    { t: 'uint128', v: xrt },
    { t: 'uint64', v: when }
  )
}

const signUpdateHash = (pk, base, quote, xrt, when) => { 
  pk = pk.replace(/^0x/, '') // remove 0x at the beginning
  const keyBuffer = Buffer.from(pk, 'hex')
  const data = updateDataHash(base, quote, formatRate(xrt), when)
  return sigs.personalSign(keyBuffer, { data })
}

const encodeUpdateCall = (base, quote, xrt, when, sig) => {
  const params = [ base, quote, formatRate(xrt), when, sig ]
  return abi.encodeFunctionCall(updateFunction, params)
}

const signAndEncodeUpdateCall = (pk, base, quote, xrt, when) => {
  const sig = signUpdateHash(pk, base, quote, xrt, when)
  return encodeUpdateCall(base, quote, xrt, when, sig)
}

const encodeUpdateManyCall = (bases, quotes, xrts, whens, sigs) => {
  const concatenatedSigs = sigs.reduce((acc, sig) => acc + sig.slice(2), '0x')
  const params = [ bases, quotes, xrts.map(x => formatRate(x)), whens, concatenatedSigs ]
  return abi.encodeFunctionCall(updateManyFunction, params)
}

const signAndEncodeUpdateManyCall = (pk, bases, quotes, xrts, whens) => {
  const sigs = bases.map((_, i) => signUpdateHash(pk, bases[i], quotes[i], xrts[i], whens[i]))
  return encodeUpdateManyCall(bases, quotes, xrts, whens, sigs)
}

module.exports = {
  HASH_ID,
  ONE,
  formatRate,
  parseRate,
  updateDataHash,
  signUpdateHash,
  encodeUpdateCall,
  encodeUpdateManyCall,
  signAndEncodeUpdateCall,
  signAndEncodeUpdateManyCall,
}
