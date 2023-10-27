const EventEmitter = require ('events')

class DbCall extends EventEmitter {

	constructor (db, sql, params = [], options = {}) {

		if (!db) throw Error ('DbCall: db must be defined')
		if (typeof sql !== 'string') throw Error ('DbCall: sql must be a string, found: ' + sql)

		super ()

		this.db = db
		this.sql = sql
		this.params = params
		this.options = options

	}

}

module.exports = DbCall