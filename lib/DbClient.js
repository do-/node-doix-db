const EventEmitter    = require ('events')
const {randomUUID}    = require ('crypto')
const {Readable}      = require ('stream')

const DbCsvPrinter    = require ('./DbCsvPrinter.js')
const DbCall          = require ('./DbCall.js')
const DbQuery         = require ('./query/DbQuery.js')
const DbMigrationPlan = require ('./migration/DbMigrationPlan.js')

const PR_QUERY        = Symbol.for ('query')
const PR_CALL         = Symbol.for ('call')
const PR_COLUMNS      = Symbol.for ('columns')
const PR_COUNT        = Symbol.for ('count')

const set = (o, k, v) => Object.defineProperty (o, k, {
	configurable: false,
	enumerable: false,
	get: () => v
})

const setAll = (rows, call, q) => {
	set (rows, PR_CALL, call)
	set (rows, PR_COLUMNS, call.columns)
	if (q instanceof DbQuery) set (rows, PR_QUERY, q)	
}

class DbClient extends EventEmitter {

	constructor () {
	
		super ()

		this.count = 0
		
		this.uuid = randomUUID ()
	
	}

	async createTempTable (table, options) {

		if (typeof table === 'string') table = this.model.find (table)

		return this.do (this.lang.genCreateTempTable (table, options))

	}

	toCsv (options) {

		const {lang} = this

		return new DbCsvPrinter ({...options, lang})

	}
	
	createMigrationPlan () {
	
		return new DbMigrationPlan (this)
	
	}

	async getArrayOnly (q, params = [], o = {}) {

		const options = {...o}

		if (!('maxRows' in options)) {
			options.maxRows = 1000
			options.checkOverflow = true
		}

		const call = this.call (q, params, options)

		await call.exec ()

		const {rows} = call

		setAll (rows, call, q)

		return rows

	}

	async getArray (q, p, o) {

		const arrayOnly = this.getArrayOnly (q, p, o)

		if (!(q instanceof DbQuery) || !('offset' in q.options)) return arrayOnly

		const [rows, cnt] = await Promise.all ([
			arrayOnly,
			this.getScalar (q.toQueryCount ())
		])
		
		set (rows, PR_COUNT, parseInt (cnt))
		
		return rows

	}

	async getObject (sql, params = [], options = {}) {
	
		const {model} = this; if (model) {

			const relation = model.find (sql); if (relation) {

				const {name, pk} = relation, filters = []; for (let i = 0; i < pk.length; i ++) filters.push ([pk [i], '=', params [i]])

				sql = model.createQuery ([[name, {filters}]])

			}

		}

		return this.call (sql, params, {
			...options,
			minRows: 1,
			maxRows: 1,
		}).exec ()

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

	async do (sql, params = [], options = {}) {

		const call = this.call (sql, params, {
			...options,
			maxRows: 0,
		})
		
		await call.exec ()

		call.finish ()

		return call

	}

	async insert (name, data, options = {}) {
			
		if (data instanceof Readable) {			

			return this.insertStream (name, data, options)

		}
		else if (Array.isArray (data)) {

			return this.insertArray (name, data, options)

		}
		else {

			return this.insertRecord (name, data, options)

		}
		
	}

	async insertStream (name, is, options) {

		const firstRecord = await new Promise ((ok, fail) => {
			is.once ('error', fail)
			is.once ('readable', () => ok (is.read (1)))
		})

		if (firstRecord === null) return

		let {columns} = options; if (!columns) columns = Object.keys (firstRecord)

		const o = {}; for (const [k, v] of Object.entries (options)) if (k !== 'columns') o [k] = v

		const os = await this.putObjectStream (name, columns, o)

		return new Promise ((ok, fail) => {

			is.on ('error', fail)
			os.on ('error', fail)
			os.on ('complete', ok)

			os.write (firstRecord)
			is.pipe (os)

		})

	}

	async insertArray (name, records, options) {
			
		return this.insertStream (name, Readable.from (records), options)

	}

	async insertRecord (name, record, options) {
			
		const params = this.lang.genInsertParamsSql (name, record, options)
		
		const sql = params.pop ()
		
		await this.do (sql, params)

	}

	async update (name, data, options = {}) {
			
		const params = this.lang.genUpdateParamsSql (name, data, options)
		
		if (params === null) return
		
		const sql = params.pop ()
		
		await this.do (sql, params)

	}

	async getStream (q, p = [], options = {}) {

		const call = this.call (q, p, {
			...options,
			maxRows: Infinity,
		})
		
		const rows = await call.exec ()

		setAll (rows, call, q)

		return rows
		
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