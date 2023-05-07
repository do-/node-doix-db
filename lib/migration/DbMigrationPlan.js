const EventEmitter = require ('events')

class DbMigrationPlan extends EventEmitter {

	constructor (db) {

		super ()

		this.db    = db
		this.lang  = db.lang
		this.model = db.model
		this.toBe  = db.model.map
		this.asIs  = new Map ()

		this.on ('existing', o => this.asIs.set (o.name, o))

	}

	async loadStructure () {

		return Promise.all (this.db.lang.getDbObjectClassesToDiscover ().map (type => this.loadExistingObjects (type)))

	}

	async loadExistingObjects (type) {
	
		const methodName = `getStreamOfExisting${type.name.slice (2)}s`

		const {db, asIs, toBe} = this, s = await db [methodName] ()

		return new Promise ((ok, fail) => {
		
			s.on ('error', fail)
			
			s.on ('end', ok)
			
			s.on ('data', table => this.emit (			
				toBe.has (table.name) ? 'existing' : 'unknown', 
				table
			))

		})
		
	}

}

module.exports = DbMigrationPlan