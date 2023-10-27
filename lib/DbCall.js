const EV_FINISH = 'finish'
const EV_END_STREAM = [
	'end',
	'close',
]

const EventEmitter = require ('events')

class DbCall extends EventEmitter {

	constructor (db, sql, params = [], options = {}) {

		if (!db) throw Error ('DbCall: db must be defined')
		if (typeof sql !== 'string') throw Error ('DbCall: sql must be a string, found: ' + sql)

		super ()

		if (!('maxRows' in options)) options.maxRows = 0

		if (typeof options.maxRows !== 'number') throw Error ('DbCall: maxRows must be a number, found: ' + options.maxRows)

		if (options.maxRows < 0) throw Error ('DbCall: maxRows cannot be negative, found: ' + options.maxRows)

		if (options.maxRows > 0) {

			if (!('rowMode' in options)) options.rowMode = 'object'

		}
		else {

			if ('rowMode' in options) throw Error ('DbCall: rowMode cannot be set with maxRows=' + options.maxRows)

		}

		this.db = db
		this.sql = sql
		this.params = params
		this.options = options

	}
/*
	finish () {

		this.emit (EV_FINISH)

		this.removeAllListeners (EV_FINISH)

	}

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