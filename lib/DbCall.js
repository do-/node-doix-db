const EV_FINISH = 'finish'
const EV_ERROR = 'error'
const EV_END_STREAM = [
	'end',
	'close',
]

const MD_ARRAY = 'array'
const MD_OBJECT = 'object'
const MD_SCALAR = 'scalar'

const EventEmitter = require ('events')
const {Transform} = require ('stream')

class DbCall extends EventEmitter {

	constructor (db, sql, params = [], options = {}) {

		if (!db) throw Error ('DbCall: db must be defined')
		if (typeof sql !== 'string') throw Error ('DbCall: sql must be a string, found: ' + sql)

		super ()

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

		}
		else {

			if ('rowMode' in options) throw Error ('DbCall: rowMode cannot be set with maxRows=' + options.maxRows)

			if ('checkOverflow' in options) throw Error ('DbCall: checkOverflow cannot be set with maxRows=' + options.maxRows)

		}

		this.db = db
		this.sql = sql
		this.params = params
		this.options = options

	}

	get objectMode () {

		return this.options.rowMode === MD_OBJECT

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
		
		const xform = new Transform ({
			objectMode: true,
			transform (r, __, cb) {cb (null, r [0])}
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
					a.push (r)
				}

				: r => {
					if (stop) return
					a.push (r)
					if (a.length === maxRows) rows.emit ('end')
				}

			)

		}).finally (() => rows.destroy ())

		this.rows = a
		
	}


/*
	async exec () {

		const {db} = this

		db.lang.normalizeSQL (this)

		const finish = () => this.finish ()

		this.once ('error', finish)

		this.emit ('start')

		try {

			await db.exec (this)

			const {rows} = this

			if (rows instanceof EventEmitter) {

				rows.on (this.error, e => this.emit ('error', e))

				for (const event of EV_END_STREAM) rows.once (event, finish)

			}
			else {

				this.finish ()

			}

			return rows

		}
		catch (error) {

			this.emit ('error', this.error = error)

			throw error

		}

	}
*/
}

module.exports = DbCall