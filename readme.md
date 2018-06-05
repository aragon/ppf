# Passive Pricefeed (PPF)

The basic idea of PPFs is that rather than requiring a contract to be fed prices directly by a particular account, the feed operator can sign messages containing a feed price update. The feed operator can make this resource available via a REST API or a whisper type protocol. 

Users of the contracts depending on the feed that require an updated value (because it has expired or because it is beneficial for them to provide an update) can take the signed value provided by the operator and submit it on chain themselves. By submitting a signed message, the actual call can be performed by anyone, and operating and maintaining a price feed is far less complicated as there is no risk of it running out of ETH.

What it allows is having a price feed that can be always up to date the moment is needed, while saving on gas for moments when it is not needed.

## Setup

```
npm i
```