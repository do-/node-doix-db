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

	async getObject (sqlOrName, p = [], options = {}) {
	
		const params = this.lang.genSelectObjectParamsSql (sqlOrName, p), sql = params.pop ()

		const a = await this.getArray (sql, params, {
			...options,
			maxRows: 1
		})
	
		if (a.length === 1) return a [0]
	
		const {notFound} = options; if (notFound instanceof Error) throw notFound
		
		return 'notFound' in options ? notFound : {}

	}

	async getScalar (sql, params = [], options = {}) {

		return this.getObject (sql, params, {
			notFound: undefined,
			...options,
			rowMode: 'scalar',
		})
		
	}

	call (sql, params, options) {

		const call = new DbCall (this, sql, params, options)

		call.tracker = new this.pool.trackerClass (call)

		return call

	}

}

module.exports = DbClient