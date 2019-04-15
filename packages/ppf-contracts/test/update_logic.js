const { ONE, formatRate, parseRate } = require('@aragon/ppf.js')
const { assertRevert } = require('@aragon/test-helpers/assertThrow')
const priceData = require('./data/prices')

const PPF = artifacts.require('PPFNoSigMock')

contract('PPF, update logic', () => {
	const TOKEN_1 = '0x1234'
	const TOKEN_2 = '0x5678'
	const TOKEN_3 = '0xabcd'
	const SIG = '0x' + '00'.repeat(65) // sig full of 0s

	const assertBig = (x, c, s = 'formatRateber') => {
		assert.equal(parseRate(x), c.toFixed(4), `${s} should have matched`)
	}

	beforeEach(async () => {
		this.ppf = await PPF.new()
	})

	context('update:', () => {
		it('rate is 0 before an update', async () => {
			const [rate, when] = await this.ppf.get.call(TOKEN_1, TOKEN_2)

			assert.equal(rate, 0, 'rate should be 0')
			assert.equal(when, 0, 'when should be 0')
		})

		it('updates feed', async () => {
			const XRT = 2

			await this.ppf.update(TOKEN_1, TOKEN_2, formatRate(XRT), 1, SIG)

			const [rate, when1] = await this.ppf.get.call(TOKEN_1, TOKEN_2)
			const [inverseRate, when2] = await this.ppf.get.call(TOKEN_2, TOKEN_1)

			assertBig(rate, XRT, 'rate')
			assertBig(inverseRate, 1/XRT, 'inverse rate')

			assert.equal(when1.toString(), when2.toString(), 'updates must match')
			assert.equal(when1, 1, 'update should be 1')
		})

		it('updates feed inversely', async () => {
			await this.ppf.update(TOKEN_2, TOKEN_1, formatRate(1/3), 1, SIG)

			const [rate, when1] = await this.ppf.get.call(TOKEN_1, TOKEN_2)
			const [inverseRate, when2] = await this.ppf.get.call(TOKEN_2, TOKEN_1)

			assertBig(rate, 3, 'rate')
			assertBig(inverseRate, 0.3333, 'inverse rate')
		})

		it('can update many pairs', async () => {
			await this.ppf.update(TOKEN_1, TOKEN_2, formatRate(1), 1, SIG)
			await this.ppf.update(TOKEN_2, TOKEN_3, formatRate(2), 2, SIG)
			await this.ppf.update(TOKEN_1, TOKEN_3, formatRate(3), 3, SIG)
			
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
				await this.ppf.update(tokenAddress(i), USD, formatRate(price), 1, SIG)
				
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
				await this.ppf.update(USD, tokenAddress(i), formatRate(1/price), 1, SIG)
				
				const [rate] = await this.ppf.get.call(tokenAddress(i), USD)
				assertBig(rate, price)

				const [inverseRate] = await this.ppf.get.call(USD, tokenAddress(i))
				assertBig(inverseRate, 1/price)
			}
		})
	})

	context('update-checks:', () => {
		it('fails if base equals quote', async () => {
			await assertRevert(() => {
				return this.ppf.update(TOKEN_1, TOKEN_1, formatRate(2), 1, SIG)
			})

			// Assert that the rate is 1 if quote == base even if update reverts
			const [ rate ] = await this.ppf.get.call(TOKEN_1, TOKEN_1)
			assertBig(rate, 1)
		})

		it('fails if updating with past value', async () => {
			await this.ppf.update(TOKEN_1, TOKEN_2, formatRate(2), 5, SIG)
			await this.ppf.update(TOKEN_1, TOKEN_3, formatRate(2), 4, SIG) // can update another pair
			
			await assertRevert(() => {
				return this.ppf.update(TOKEN_2, TOKEN_1, formatRate(3), 4, SIG) // fails with a present pair
			})
		})

		it('fails if updating to a time in the future', async () => {
			await assertRevert(() => {
				return this.ppf.update(TOKEN_1, TOKEN_2, formatRate(3), 100+parseInt(+new Date()/1000), SIG)
			})
		})

		it('fails if xrt is 0', async () => {
			await this.ppf.update(TOKEN_1, TOKEN_2, 1, 5, SIG) // can set very low value
			await assertRevert(() => {
				return this.ppf.update(TOKEN_1, TOKEN_2, 0, 6, SIG) // fails on 0
			})
		})
	})

	context('updateMany-checks', () => {
		const tests = [
			{
				title: 'updates 0 pairs',
				args: [[], [], [], [], '0x'],
			},
			{
				title: 'bases and quotes lengths missmatch',
				args: [[TOKEN_1, TOKEN_1], [TOKEN_2], [1, 1], [1, 1], SIG]
			},
			{ 
				title: 'rates length missmatches',
				args: [[TOKEN_1, TOKEN_1], [TOKEN_2, TOKEN_3], [1], [1, 1], SIG],
			},
			{
				title: 'whens length missmatches',
				args: [[TOKEN_1, TOKEN_1], [TOKEN_2, TOKEN_3], [1, 1], [1], SIG],
			},
			{
				title: 'sigs length missmatches',
				args: [[TOKEN_1, TOKEN_1], [TOKEN_2, TOKEN_3], [1, 1], [1, 1], SIG],
			},
			{
				title: 'sigs length is incorrect',
				args: [[TOKEN_1, TOKEN_1], [TOKEN_2, TOKEN_3], [1, 1], [1, 1], SIG + SIG.slice(2) + '01']
			}
		]

		tests.forEach(({ title, args }) => {
			it(`fails if ${title}`, async () => {
				await assertRevert(() => {
					return this.ppf.updateMany(...args)
				})
			})
		})
	})
})