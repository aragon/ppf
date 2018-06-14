const {
	signUpdate, 
	computeUpdateCall, 
	ONE, 
	formatRate,
	parseRate, 
} = require('@aragon/ppf.js')

const { assertRevert } = require('@aragon/test-helpers/assertThrow')

const PPF = artifacts.require('PPF')

contract('PPF, signature logic', ([operatorOwner, guy]) => {
	const TOKEN_1 = '0x1234123412341234123412341234123412341234'
	const TOKEN_2 = '0x5678567856785678567856785678567856785678'

	const OPERATOR_PK = '0xb9694bb642e9721b2d5ed112a9114ff32f07f15b4a3b10a4e1651e9542c6fe2f'
	const OPERATOR = '0x6ec28f4e814f88da2d981e6e787b786162006d39'

	beforeEach(async () => {
		this.ppf = await PPF.new(OPERATOR, operatorOwner)
	})

	it('submits signed updated', async () => {
		const xrt = 2
		const when = 1

		const sig = signUpdate(OPERATOR_PK, TOKEN_1, TOKEN_2, xrt, when)

		await this.ppf.update(TOKEN_1, TOKEN_2, formatRate(xrt), when, sig)

		const [r, w] = await this.ppf.get.call(TOKEN_1, TOKEN_2)		

		assert.equal(parseRate(r), xrt, 'rate should have been updated')
		assert.equal(w, when, 'when should have been updated')
	})

	it('updates with ppf.js generated call data', async () => {
		const xrt = 3
		const when = 1

		const data = computeUpdateCall(OPERATOR_PK, TOKEN_1, TOKEN_2, xrt, when)

		const tx = {
			from: guy,
			to: this.ppf.address,
			gasLimit: 2e6, // solidity-coverage needs
			data
		}

		await new Promise((resolve, reject) => {
			web3.eth.sendTransaction(tx, (err, hash) => {
				if (err) return reject(err)
				resolve(hash)
			})
		})

		const [r, w] = await this.ppf.get.call(TOKEN_1, TOKEN_2)		

		assert.equal(parseRate(r), xrt, 'rate should have been updated')
		assert.equal(w, when, 'when should have been updated')
	})

	it('allows old signature v value', async () => {
		const xrt = 1
		const when = 3

		const sig = signUpdate(OPERATOR_PK, TOKEN_1, TOKEN_2, xrt, when)
		const v = sig.substr(-2) // 1b or 1c
		const oldV = v == '1b' ? '00' : '01'
		const oldSig = sig.substr(0, sig.length-2) + oldV

		await this.ppf.update(TOKEN_1, TOKEN_2, formatRate(xrt), when, oldSig)
	})

	it('fails if operator is changed', async () => {
		const xrt = 2
		const when = 1

		const sig = signUpdate(OPERATOR_PK, TOKEN_1, TOKEN_2, xrt, when)

		await this.ppf.setOperator(guy, { from: operatorOwner })
		await assertRevert(() => {
			return this.ppf.update(TOKEN_1, TOKEN_2, formatRate(xrt), when, sig)
		})
	})

	it('fails if private key is incorrect', async () => {
		const xrt = 2
		const when = 1

		const modifiedKey = OPERATOR_PK.replace('b9', 'b8') // change first byte
		const sig = signUpdate(modifiedKey, TOKEN_1, TOKEN_2, xrt, when)

		await assertRevert(() => {
			return this.ppf.update(TOKEN_1, TOKEN_2, formatRate(xrt), when, sig)
		})
	})

	it('fails if signed hash differs', async () => {
		const xrt = 2
		const when = 1

		const sig = signUpdate(OPERATOR_PK, TOKEN_1, TOKEN_2, xrt, when)

		const modifiedWhen = when + 1

		await assertRevert(() => {
			return this.ppf.update(TOKEN_1, TOKEN_2, formatRate(xrt), modifiedWhen, sig)
		})
	})

	it('fails if base and quote are swapped', async () => {
		const xrt = 2
		const when = 1

		const sig = signUpdate(OPERATOR_PK, TOKEN_1, TOKEN_2, xrt, when)

		await assertRevert(() => {
			return this.ppf.update(TOKEN_2, TOKEN_1, formatRate(xrt), when, sig)
		})
	})

	it('fails if v is invalid', async () => {
		const xrt = 1
		const when = 3

		const sig = signUpdate(OPERATOR_PK, TOKEN_1, TOKEN_2, xrt, when)
		const badSig = sig.substr(0, sig.length-2) + 'ff' // invalid v

		await assertRevert(() => {
			return this.ppf.update(TOKEN_1, TOKEN_2, formatRate(xrt), when, badSig)
		})
	})	
})
