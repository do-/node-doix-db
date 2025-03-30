const DbRelation = require ('../model/DbRelation.js')

const EventEmitter = require ('events')

const OBJECT_ACTIONS = [
	'create',
	'alter',
	'migrate',
	'recreate',
	'comment',
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

		this.toBe = new Map (); for (const {map} of db.model.schemata.values ())

			for (const o of map.values ())

				this.toBe.set (o.fullName, o)

		db.lang.migrationPlan = this

		this.on ('existing', o => this.asIs.set (o.fullName, o))
		
		this.toDo = new Map 
		
		for (const action of OBJECT_ACTIONS) this.on (action, object => add (
			this.toDo, 
			action, object)
		)

		for (const action of COLUMN_ACTIONS) this.on (action, column => add (
			this.asIs.get (column.relation.name).toDo, 
			action, column)
		)

		{

			const action = 'drop-column'

			this.on (action, (relation, column) => add (
				this.asIs.get (relation.name).toDo, 
				action, column)
			)

		}

	}

	compareRelation (asIs, toBe) {

		const {lang} = this, {columns, columnsToDrop} = toBe, existingColumns = asIs.columns

		for (const name of columnsToDrop) {

			if (name in existingColumns) {

				this.emit ('drop-column', asIs, name)

				delete existingColumns [name]

			}
			else {

				this.emit ('no-column-to-drop', asIs, name)

			}

		}
			
			

		for (const [name, column] of Object.entries (columns)) {

			if (name in existingColumns) {
				
				const existingColumn = existingColumns [name]

				existingColumn.diff = lang.compareColumns (existingColumn, column)

				const action = lang.getRequiredColumnMutation (existingColumn, column)
				
				if (action) this.emit (action, column)

				if (action === 'migrate-column' || existingColumn.comment != column.comment) this.emit ('comment', column)

			}
			else {

				this.emit ('add-column', column)
				
				this.emit ('comment', column)

			}

		}

	}

	compareObject (asIs, toBe) {

		if (asIs.comment != toBe.comment) this.emit ('comment', toBe)

		if (asIs.constructor === toBe.constructor && toBe instanceof DbRelation)
		
			this.compareRelation (asIs, toBe)

		return this.lang.getRequiredMutation (asIs, toBe)

	}

	inspectStructure () {
	
		const {asIs} = this; if (!asIs) throw Error ('Existing database objects not discovered, call loadStructure () first')

		const {lang} = this, hardClasses = lang.getDbObjectClassesToDiscover ()

		for (const [name, object] of this.toBe.entries ()) {

			const action = 

				!hardClasses.includes (object.constructor) ? 'recreate' :

				!asIs.has (name) ? 'create' : 
				
				this.compareObject (asIs.get (name), object)

			if (action === null) continue
				
			this.emit (action, object)

			switch (action) {

				case 'recreate':

					if (object instanceof DbRelation) 
	
						for (const column of Object.values (object.columns))
			
							this.emit ('comment', column)

				case 'create':

					this.emit ('comment', object)
				
			}
			
		}

	}

	async loadStructure () {
	
		this.asIs  = new Map ()

		return Promise.all (this.lang.getDbObjectClassesToDiscover ().map (type => this.loadExistingObjects (type)))

	}

	async loadExistingObjects (type) {
	
		const methodName = `getStreamOfExisting${type.name.slice (2)}s`

		const {db, toBe} = this, s = await db [methodName] ()

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
	
	* genDDL () {
	
		for (const i of this.lang.genDDL ()) yield i
	
	}

}

module.exports = DbMigrationPlan