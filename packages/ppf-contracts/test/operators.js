const { assertRevert } = require('@aragon/test-helpers/assertThrow')

const PPF = artifacts.require('PPF')

contract('PPF, operators', ([_, operator, operatorOwner, guy]) => {
	const ZERO = '0x00'

	context('initialized ppf', () => {
		beforeEach(async () => {
			this.ppf = await PPF.new(operator, operatorOwner)
		})

		it('operators are correctly set', async () => {
			assert.equal(await this.ppf.operator(), operator, 'operator should be set')
			assert.equal(await this.ppf.operatorOwner(), operatorOwner, 'operatorOwner should be set')
		})

		context('updating operator:', () => {
			it('operator can update', async () => {
				await this.ppf.setOperator(guy, { from: operator })
				assert.equal(await this.ppf.operator(), guy, 'operator should have been changed')
			})

			it('operatorOwner can update', async () => {
				await this.ppf.setOperator(guy, { from: operatorOwner })
				assert.equal(await this.ppf.operator(), guy, 'operator should have been changed')
			})

			it('fails if unauthorized', async () => {
				await assertRevert(() => {
					return this.ppf.setOperator(guy, { from: guy })
				})
			})

			it('fails if updating to null', async () => {
				await assertRevert(() => {
					return this.ppf.setOperator(ZERO, { from: operatorOwner })
				})
			})
		})

		context('updating operator owner:', () => {
			it('operator cannot update', async () => {
				await assertRevert(() => {
					return this.ppf.setOperatorOwner(guy, { from: operator })
				})
			})

			it('operatorOwner can update', async () => {
				await this.ppf.setOperatorOwner(guy, { from: operatorOwner })
				assert.equal(await this.ppf.operatorOwner(), guy, 'operatorOwner should have been changed')
			})

			it('fails if unauthorized', async () => {
				await assertRevert(() => {
					return this.ppf.setOperatorOwner(guy, { from: guy })
				})
			})

			it('fails if updating to null', async () => {
				await assertRevert(() => {
					return this.ppf.setOperatorOwner(ZERO, { from: operatorOwner })
				})
			})
		})
	})

	context('constructor errors:', () => {
		it('fails if operator is null', async () => {
			await assertRevert(() => {
				return PPF.new(ZERO, operatorOwner)
			})
		})

		it('fails if operatorOwner is null', async () => {
			await assertRevert(() => {
				return PPF.new(operator, ZERO)
			})
		})
	})
})