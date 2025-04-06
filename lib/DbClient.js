const EventEmitter    = require ('events')
const {Readable, Writable}      = require ('stream')
const {Tracker}       = require ('events-to-winston')

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

		this.txn = null
			
	}

	get [Tracker.LOGGING_PARENT] () {

		return this.job

	}

	get [Tracker.LOGGING_ID] () {

		return this.name

	}

	getCallLoggingEvents () {

		return {

			start: {
				level: 'info',
				message: function () {return this.sql},
				details: {},
			},
		
			finish: {
				level: 'info',
				elapsed: true,
			}

		}

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

	async do (q, params = [], options = {}) {

		let sql

		if (typeof q === 'string') {

			sql = q

		}
		else if (Array.isArray (q)) {

			const {length} = q; if (length === 0 || length > 2) throw Error ('Invalid `do` array parameter length: ' + length)

			sql = q [0]

			if (length === 2) params = q [1]

		}
		else if (typeof q === 'object') {

			if ('sql' in q) {

				sql = q.sql 

			} 
			else {

				throw Error ('Invalid `do` object parameter')

			}

			if ('params' in q) {

				params = q.params

			} 

		}
		else {

			throw Error ('Invalid `do` parameter: ' + q)

		}

		const call = this.call (sql, params, {
			...options,
			maxRows: 0,
		})
		
		await call.exec ()

		call.finish ()

		return call

	}

	batch (options = {}) {

		const db = this

		return new Writable ({...options, objectMode: true,

			write (qp, _, callback) {

				db.do (qp).then (_ => callback (), callback)

			}

		})

	}

	async doAll (statements, options = {}) {

		if (typeof statements !== 'object') throw Error ('Expected iterable or readable, got ' + statements)

		if (statements === null) throw Error ('Expected iterable or readable, got null')

		if (!(statements instanceof Readable)) {

			if (typeof statements [Symbol.iterator] !== 'function') throw Error ('Expected iterable or readable, got ' + statements)

			statements = Readable.from (statements)

		}

		const executor = this.batch (options)

		try {

			await new Promise ((ok, fail) => {

				statements.on ('error', fail)
				executor.on ('error', fail)
				executor.on ('close', ok)
	
				statements.pipe (executor)
	
			})
	

		}
		catch (cause) {

			throw Error (cause.message, {cause})

		}

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
		
		return this.do (sql, params)

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

		call.tracker = new Tracker (call, this.pool.logger)
		call.tracker.listen ()

		return call

	}

	async peek (queue) {

		return this.getObject (this.lang.genPeekSql (queue), [], {notFound: null})

	}

}

module.exports = DbClient