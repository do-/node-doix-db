const EventEmitter  = require ('events')
const {randomUUID}  = require ('crypto')
const DbQuery = require ('./query/DbQuery.js')

class DbClient extends EventEmitter {

	constructor () {
	
		super ()
		
		this.uuid = randomUUID ()
	
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