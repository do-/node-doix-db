const EV_FINISH = 'finish'
const EV_ERROR = 'error'
const EV_END_STREAM = [
	'end',
	'close',
]

const OPT_REQUIRING_MAX_ROW = [
	'rowMode',
	'checkOverflow',
	'minRows',
]

const NULL = Symbol.for ('NULL'), mayBeNull = v => v === NULL ? null : v

const MD_ARRAY = 'array'
const MD_OBJECT = 'object'
const MD_SCALAR = 'scalar'

const EventEmitter = require ('events')
const {Transform} = require ('stream')

class DbCall extends EventEmitter {

	constructor (db, sql, params = [], options = {}) {

		if (!db) throw Error ('DbCall: db must be defined')

		super ()

		this.ord = ++ db.count

		if (typeof sql !== 'string') throw Error ('DbCall: sql must be a string, found: ' + sql)

		if (!('maxRows' in options)) options.maxRows = 0

		if (typeof options.maxRows !== 'number') throw Error ('DbCall: maxRows must be a number, found: ' + options.maxRows)

		if (options.maxRows < 0) throw Error ('DbCall: maxRows cannot be negative, found: ' + options.maxRows)

		if (options.maxRows > 0) {

			if (!('rowMode' in options)) options.rowMode = MD_OBJECT

			switch (options.rowMode) {

				case MD_ARRAY:
				case MD_OBJECT:
				case MD_SCALAR:
					break
				
				default:
					throw Error ('DbCall: rowMode must be one of (scalar|array|object) found' + options.rowMode)

			}

			if (!('checkOverflow' in options)) options.checkOverflow = false

			if (typeof options.checkOverflow !== 'boolean') throw Error ('DbCall: checkOverflow must be a boolean, found: ' + options.maxRows)

			if (options.maxRows === Infinity) {

				if ('minRows' in options) throw Error ('DbCall: minRows requires a finite maxRows')

			}
			else {

				if (!('minRows' in options)) options.minRows = 0

				if (typeof options.minRows !== 'number') throw Error ('DbCall: minRows must be a number, found: ' + options.minRows)

				if (options.minRows < 0) throw Error ('DbCall: minRows cannot be negative, found: ' + options.minRows)

				if (options.minRows > options.maxRows) throw Error ('DbCall: minRows cannot exceed maxRows=' + options.maxRows)

			}

		}
		else {

			for (const k of OPT_REQUIRING_MAX_ROW) if (k in options) throw Error (`DbCall: ${k} cannot be set with maxRows=${options.maxRows}`)

		}

		this.db = db
		this.sql = sql
		this.params = params
		this.options = options

	}

	get objectMode () {

		return this.options.rowMode === MD_OBJECT

	}

	get result () {

		const {rows, options: {minRows, maxRows}} = this

		if (maxRows === 0) return

		if (minRows > rows.length) throw Error (`Missing data: ${rows.length} found, ${minRows} required`)

		return maxRows === 1 ? rows [0] : rows

	}

	finish () {

		this.emit (EV_FINISH)

		this.removeAllListeners (EV_FINISH)

	}

	flattenArray () {

		const {rows} = this

		for (let i = 0; i < rows.length; i ++) rows [i] = rows [i] [0]

	}
	
	flattenStream () {

		const {rows} = this
		
		const xform = new Transform ({objectMode: true,
			transform (r, __, cb) {
				const v = r [0]
				cb (null, v == null ? NULL : v)
			}
		})

		rows.once ('error', e => xform.destroy (e))

		this.rows = this.rows.pipe (xform)

	}

	observeStream () {

		const {rows} = this

		rows.on (EV_ERROR, e => this.emit (EV_ERROR, e))

		const finish = () => this.finish ()

		for (const event of EV_END_STREAM) rows.once (event, finish)

	}
	
	processArray () {

		if (this.options.rowMode === MD_SCALAR) this.flattenArray ()

		this.finish ()

		return this.result

	}

	processStream () {

		const {rowMode} = this.options

		if (rowMode === MD_SCALAR) this.flattenStream ()

		this.observeStream ()

	}

	async fetchStream () {

		const a = [], {rows, options: {maxRows, checkOverflow}} = this; await new Promise ((ok, fail) => {

			rows.once ('error', fail)

			let stop = false; rows.on ('end', () => ok (stop = true))

			rows.on ('data',

				checkOverflow ? r => {
					if (a.length === maxRows) return rows.destroy (Error ('Result set overflow, maxRows = ' + maxRows))
					a.push (mayBeNull (r))
				}

				: r => {
					if (stop) return
					a.push (mayBeNull (r))
					if (a.length === maxRows) rows.emit ('end')
				}

			)

		}).finally (() => rows.destroy ())

		this.rows = a
		
	}

	async exec () {

		const {db} = this

		db.lang.normalizeSQL (this)

		this.once ('error', () => this.finish ())

		try {

			const {maxRows} = this.options

			this.emit ('start')

			await db.exec (this) 
			
			this.emit ('result')

			if (maxRows === 0) return

			if (Array.isArray (this.rows)) return this.processArray ()

			this.processStream ()

			if (maxRows === Infinity) return this.result

			await this.fetchStream ()

			return this.result

		}
		catch (error) {

			this.emit ('error', this.error = error)

			throw error

		}

	}

}

module.exports = DbCall