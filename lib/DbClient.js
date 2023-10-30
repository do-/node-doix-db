const EventEmitter    = require ('events')
const {randomUUID}    = require ('crypto')

const DbCall          = require ('./DbCall.js')
const DbQuery         = require ('./query/DbQuery.js')
const DbMigrationPlan = require ('./migration/DbMigrationPlan.js')

class DbClient extends EventEmitter {

	constructor () {
	
		super ()

		this.count = 0
		
		this.uuid = randomUUID ()
	
	}
	
	createMigrationPlan () {
	
		return new DbMigrationPlan (this)
	
	}

	async getArrayBySql (sql, params = [], o = {}) {

		const options = {...o}

		if (!('maxRows' in options)) {
			options.maxRows = 1000
			options.checkOverflow = true
		}

		const call = this.call (sql, params, options)

		await call.exec ()

		const {rows, columns} = call

		Object.defineProperty (rows, Symbol.for ('columns'), {
			configurable: false,
			enumerable: false,
			get: () => columns
		})

		return rows

	}
	
	async getArray (q, p, o) {

		if (!(q instanceof DbQuery)) return this.getArrayBySql (q, p, o)
		
		const addCount = 'offset' in q.options, todo = addCount ? [null, this.getScalar (q.toQueryCount ())] : []
				
		const params = this.lang.toParamsSql (q), sql = params.pop (); todo [0] = this.getArrayBySql (sql, params, o)

		const done = await Promise.all (todo), rows = done [0]

		Object.defineProperty (rows, Symbol.for ('query'), {
			configurable: false,
			enumerable: false,
			get: () => q
		})

		if (addCount) {

			const count = parseInt (done [1]), get = () => count

			Object.defineProperty (rows, Symbol.for ('count'), {
				configurable: false,
				enumerable: false,
				get
			})

		}
		
		return rows
	
	}

	async getObject (sql, params = [], options = {}) {
	
		const {model} = this; if (model) {

			const relation = model.find (sql); if (relation) {

				const {name, pk} = relation, filters = []; for (let i = 0; i < pk.length; i ++) filters.push ([pk [i], '=', params [i]])

				sql = model.createQuery ([[name, {filters}]])

			}

		}

		const a = await this.getArray (sql, params, {
			notFound: {},
			...options,
			minRows: 1,
			maxRows: 1
		})
	
		if (a.length === 1) return a [0]
	
		const {notFound} = options; if (notFound instanceof Error) throw notFound
		
		return 'notFound' in options ? notFound : {}

	}

	async getScalar (sql, params = [], options = {}) {

		return this.call (sql, params, {
			notFound: undefined,
			...options,
			rowMode: 'scalar',
			minRows: 1,
			maxRows: 1,
		}).exec ()
		
	}

	call (q, params, options) {

		if (q instanceof DbQuery) {

			params = this.lang.toParamsSql (q)
			
			q = params.pop ()

		}

		const call = new DbCall (this, q, params, options)

		call.tracker = new this.pool.trackerClass (call)

		return call

	}

}

module.exports = DbClient