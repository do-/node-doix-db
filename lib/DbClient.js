const EventEmitter    = require ('events')
const {randomUUID}    = require ('crypto')

const DbQuery         = require ('./query/DbQuery.js')
const DbMigrationPlan = require ('./migration/DbMigrationPlan.js')

const NULL = Symbol.for ('NULL')

class DbClient extends EventEmitter {

	constructor () {
	
		super ()
		
		this.uuid = randomUUID ()
	
	}
	
	createMigrationPlan () {
	
		return new DbMigrationPlan (this)
	
	}

	async getArrayBySql (sql, params = [], options = {}) {

		const maxRows = options.maxRows || 1000
		const isPartial = options.isPartial === true
		
		const s = await this.getStream (sql, params, options)
		const rows = []

		Object.defineProperty (rows, Symbol.for ('columns'), {
			configurable: false,
			enumerable: false,
			get: () => s [Symbol.for ('columns')]
		})
		
		for await (const r of s) {

			if (rows.length === maxRows && !isPartial) {

				const err = Error (maxRows + ' rows limit exceeded. Please fix the request or consider using getStream instead of getArray')

				s.destroy (err)

				throw err

			}				

			rows.push (r === NULL ? null : r)

			if (rows.length === maxRows && isPartial) {
				
				s.destroy ()

				break
				
			}

		}

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
			maxRows: 1,		
			isPartial: true,
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

}

module.exports = DbClient