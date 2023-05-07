const EventEmitter = require ('events')

const ACTIONS = [
	'create',
	'alter',
	'migrate',
	'recreate',
]

class DbMigrationPlan extends EventEmitter {

	constructor (db) {

		super ()

		this.db    = db
		this.lang  = db.lang
		this.model = db.model
		this.toBe  = db.model.map

		db.lang.migrationPlan = this

		this.on ('existing', o => this.asIs.set (o.name, o))
		
		this.toDo = new Map; for (const a of ACTIONS) this.on (a, o => {
		
			if (!this.toDo.has (a)) this.toDo.set (a, [])
			
			this.toDo.get (a).push (o)
		
		})

	}
	
	inspectStructure () {
	
		const {asIs} = this; if (!asIs) throw Error ('Existing database objects not discovered, call loadStructure () first')

		const {lang} = this, hardClasses = lang.getDbObjectClassesToDiscover ()

		for (const [name, object] of this.toBe.entries ()) {

			const action = 

				!hardClasses.includes (object.constructor) ? 'recreate' :

				!asIs.has (name) ? 'create' : 
				
				lang.getRequiredMutation (asIs.get (name), object)

			if (action) this.emit (action, object)

		}
	
	}

	async loadStructure () {
	
		this.asIs  = new Map ()

		return Promise.all (this.lang.getDbObjectClassesToDiscover ().map (type => this.loadExistingObjects (type)))

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