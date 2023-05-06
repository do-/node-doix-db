const EventEmitter = require ('events')

class DbMigrationPlan extends EventEmitter {

	constructor (db) {

		super ()
		
		this.db    = db
		this.lang  = db.lang
		this.model = db.model
		this.toBe  = db.model.map
		this.asIs  = new Map ()

	}

}

module.exports = DbMigrationPlan