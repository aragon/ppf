const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const priceData = require('./data/prices')

const PPF = artifacts.require('PPFNoSigMock')

contract('PPF, update logic', () => {
	const TOKEN_1 = '0x1234'
	const TOKEN_2 = '0x5678'
	const TOKEN_3 = '0xabcd'
	const SIG = '0x'

	const ONE = new web3.BigNumber(10).pow(18)
	const num = x => new web3.BigNumber(x.toFixed(20)).mul(ONE)
	const parseNum = x => x.div(ONE).toNumber().toFixed(4)
	const assertBig = (x, c, s = 'number') => {
		assert.equal(parseNum(x), c.toFixed(4), `${s} should have matched`)
	}

	beforeEach(async () => {
		this.ppf = await PPF.new()
	})

	context('update-checks:', () => {
		it('fails if base equals quote', async () => {
			await assertRevert(() => {
				return this.ppf.update(TOKEN_1, TOKEN_1, num(2), 1, SIG)
			})
		})

		it('fails if updating with past value', async () => {
			const T1 = 4
			const T2 = 5

			await this.ppf.update(TOKEN_1, TOKEN_2, num(2), T2, SIG)
			await this.ppf.update(TOKEN_1, TOKEN_3, num(2), T1, SIG) // can update another pair
			
			await assertRevert(() => {
				return this.ppf.update(TOKEN_2, TOKEN_1, num(3), T1, SIG) // fails with a present pair
			})
		})

		it('fails if updating to a time in the future', async () => {
			await assertRevert(() => {
				return this.ppf.update(TOKEN_1, TOKEN_2, num(3), 100+parseInt(+new Date()/1000), SIG)
			})
		})

		it('fails if xrt is 0', async () => {
			await this.ppf.update(TOKEN_1, TOKEN_2, 1, 5, SIG) // can set very low value
			await assertRevert(() => {
				return this.ppf.update(TOKEN_1, TOKEN_2, 0, 6, SIG) // fails on 0
			})
		})
	})

	context('update:', () => {
		it('rate is 0 before an update', async () => {
			const [rate, when] = await this.ppf.get.call(TOKEN_1, TOKEN_2)

			assert.equal(rate, 0, 'rate should be 0')
			assert.equal(when, 0, 'when should be 0')
		})

		it('updates feed', async () => {
			const XRT = 2
			await this.ppf.update(TOKEN_1, TOKEN_2, num(XRT), 1, SIG)

			const [rate, when1] = await this.ppf.get.call(TOKEN_1, TOKEN_2)
			const [inverseRate, when2] = await this.ppf.get.call(TOKEN_2, TOKEN_1)

			assertBig(rate, XRT, 'rate')
			assertBig(inverseRate, 1/XRT, 'inverse rate')

			assert.equal(when1.toString(), when2.toString(), 'updates must match')
			assert.equal(when1, 1, 'update should be 1')
		})

		it('updates feed inversely', async () => {
			await this.ppf.update(TOKEN_2, TOKEN_1, num(1/3), 1, SIG)

			const [rate, when1] = await this.ppf.get.call(TOKEN_1, TOKEN_2)
			const [inverseRate, when2] = await this.ppf.get.call(TOKEN_2, TOKEN_1)

			assertBig(rate, 3, 'rate')
			assertBig(inverseRate, 0.3333, 'inverse rate')
		})

		it('can update many pairs', async () => {
			await this.ppf.update(TOKEN_1, TOKEN_2, num(1), 1, SIG)
			await this.ppf.update(TOKEN_2, TOKEN_3, num(2), 2, SIG)
			await this.ppf.update(TOKEN_1, TOKEN_3, num(3), 3, SIG)
			
			const [rate1, when1] = await this.ppf.get.call(TOKEN_2, TOKEN_1)
			const [rate2, when2] = await this.ppf.get.call(TOKEN_3, TOKEN_2)
			const [rate3, when3] = await this.ppf.get.call(TOKEN_3, TOKEN_1)

			assert.equal(when1, 1)
			assert.equal(when2, 2)
			assert.equal(when3, 3)

			assertBig(rate1, 1)
			assertBig(rate2, 1/2)
			assertBig(rate3, 1/3)
		})

		it('supports CMC price data', async () => {
			const USD = '0xff'
			const tokenAddress = i => `0xee${i}`

			for (const [i, {price}] of priceData.entries()) {
				await this.ppf.update(tokenAddress(i), USD, num(price), 1, SIG)
				
				const [rate] = await this.ppf.get.call(tokenAddress(i), USD)
				assertBig(rate, price)

				const [inverseRate] = await this.ppf.get.call(USD, tokenAddress(i))
				assertBig(inverseRate, 1/price)
			}
		})

		it('supports inverse CMC price data', async () => {
			const USD = '0xff'
			const tokenAddress = i => `0xee${i}`

			for (const [i, {price}] of priceData.entries()) {
				await this.ppf.update(USD, tokenAddress(i), num(1/price), 1, SIG)
				
				const [rate] = await this.ppf.get.call(tokenAddress(i), USD)
				assertBig(rate, price)

				const [inverseRate] = await this.ppf.get.call(USD, tokenAddress(i))
				assertBig(inverseRate, 1/price)
			}
		})
	})
})