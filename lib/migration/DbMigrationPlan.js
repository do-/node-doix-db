const DbRelation = require ('../model/DbRelation.js')

const EventEmitter = require ('events')

const OBJECT_ACTIONS = [
	'create',
	'alter',
	'migrate',
	'recreate',
]

const COLUMN_ACTIONS = [
	'add-column',
	'alter-column',
	'migrate-column',
]

const add = (toDo, action, object) => {

	if (!toDo.has (action)) toDo.set (action, [])
			
	toDo.get (action).push (object)

}

class DbMigrationPlan extends EventEmitter {

	constructor (db) {

		super ()

		this.db    = db
		this.lang  = db.lang
		this.model = db.model
		this.toBe  = db.model.map

		db.lang.migrationPlan = this

		this.on ('existing', o => this.asIs.set (o.name, o))
		
		this.toDo = new Map 
		
		for (const action of OBJECT_ACTIONS) 
		
			this.on (action, object => add (
				this.toDo, 
				action, object))

		for (const action of COLUMN_ACTIONS) 
			
			this.on (action, column => add (
				this.asIs.get (column.relation.name).toDo, 
				action, column))

	}
	
	inspectStructure () {
	
		const {asIs} = this; if (!asIs) throw Error ('Existing database objects not discovered, call loadStructure () first')

		const {lang} = this, hardClasses = lang.getDbObjectClassesToDiscover ()

		for (const [name, object] of this.toBe.entries ()) {

			let action = 

				!hardClasses.includes (object.constructor) ? 'recreate' :

				!asIs.has (name) ? 'create' : 
				
				null
				
			if (action === null) {
			
				const existing = asIs.get (name)

				if (object instanceof DbRelation && existing.constructor === object.constructor) {

					const {columns} = object, existingColumns = existing.columns
				
					for (const [name, column] of Object.entries (columns)) {
											
						if (name in existingColumns) {

							const action = lang.getRequiredColumnMutation (existingColumns [name], column)
							
//							if (action !== null) this.emit (action, column)

						}
						else {

							this.emit ('add-column', column)
						
						}
					
					}
				
				}

				action = lang.getRequiredMutation (existing, object)

			} 	

			if (action !== null) this.emit (action, object)

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

			s.on ('data', object => {
			
				object.toDo = new Map
				
				const event = toBe.has (object.name) ? 'existing' : 'unknown'

				this.emit (event, object)
				
			})

		})
		
	}

}

module.exports = DbMigrationPlan