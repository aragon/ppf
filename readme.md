# Passive Pricefeed (PPF)

The basic idea of PPFs is that rather than requiring a contract to be fed prices directly by a particular account, the feed operator can sign messages containing a feed price update. The feed operator can make this resource available via a REST API or a whisper type protocol. 

Users of the contracts depending on the feed that require an updated value (because it has expired or because it is beneficial for them to provide an update) can take the signed value provided by the operator and submit it on chain themselves. By submitting a signed message, the actual call can be performed by anyone, and operating and maintaining a price feed is far less complicated as there is no risk of it running out of ETH.

What it allows is having a price feed that can be always up to date the moment is needed, while saving on gas for moments when it is not needed.

## Setup

```
git clone https://github.com/aragon/ppf.git
cd ppf
npm i
```

## Packages

This monorepo contains the following packages:

- [ppf-contracts](./packages/ppf-contracts): The on-chain component of PPF and tests
- [ppf.js](./packages/ppf.js): JS library used to generate price feed update signatures and transactions
- [ppf-server](./packages/ppf-server): Background process that keeps prices updated and serves a REST API and server-generated webapp.

## Tickers and token addresses

Because PPF can provide exchange rates not only between tokens, but also ether or fiat currencies, the token addresses in a pair (base or quote) can be:

- ERC20 asset: the token address will correspond to the address of the token in that chain.
- Ether: the token address will be an address comprised of only 0s: `0x0000000000000000000000000000000000000000`
- Fiat currency or other off-chain assets: It will the maxiumum address (2^160 or `0xffffff...`) minus the ASCII representation of the chars in the ticker. For example, EUR is `0xFfFfffFfffFfffFfFfFFfFFFFFFFffFfFfbAaAAD`. Example code for generating this can be found [here](https://github.com/aragon/ppf/blob/fc41cb5cd37ba00d4eb5ae7610c565e5db684218/packages/ppf-server/helpers/tokenFromTicker.js)
