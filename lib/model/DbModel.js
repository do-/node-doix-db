const EventEmitter         = require ('events')

const DbPool               = require ('../DbPool.js')
const DbLang               = require ('../DbLang.js')
const DbSchemaSource       = require ('./DbSchemaSource.js')
const DbRelation           = require ('./DbRelation.js')
const DbSchema             = require ('./DbSchema.js')
const DbQuery              = require ('../query/DbQuery.js')

const EV_OBJECTS_CREATED = 'objects-created'

class DbModel extends EventEmitter {

	constructor (o) {
	
		super ()

		this.schemata = new Map ()

		this.mapOptions = {}

		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'schemata':
				for (const a of v) Array.isArray (a) ? this.addSchema (a [0], a [1]) : this.addSchema (a)
				break

			case 'dir':
			case 'ext':
			case 'merger':
				this.mapOptions [k] = v
				break

			case 'db':
				if (!(v instanceof DbPool)) throw new Error ('Only DbPool descendant can be used as db')
				this.db = v
				v.model = this
				break

			default:
				throw new Error ('Unknown DbModel option: ' + k)

		}

		this.lang = 'db' in this ? this.db.lang : new DbLang ()
		
		this.lang.model = this

		if (!this.schemata.has (null)) this.addSchema (null)

		this.on (EV_OBJECTS_CREATED, () => this.resolveReferences ())

	}

	addSchema (name, schemaName) {

		if (!schemaName) schemaName = name

		const o = {name, schemaName, model: this}

		if (name === null) {

			const {mapOptions} = this

			for (const k in mapOptions) o [k] = mapOptions [k]

		}

		this.schemata.set (name, new DbSchema (o))

	}

	getSchema (name) {

		return this.schemata.get (name)

	}

	get defaultSchema () {

		return this.schemata.get (null)

	}

	get map () {

		return this.defaultSchema.map

	}
	
	loadModules () {

		for (const {src} of this.schemata.values ()) if (src) src.load ()

		this.emit (EV_OBJECTS_CREATED)

	}

	resolveReferences () {

		for (const schema of this.schemata.values ()) {

			for (const object of schema.map.values ()) if (object instanceof DbRelation) {

				for (const column of Object.values (object.columns)) if ('reference' in column) {

					const {reference} = column, {targetRelationName} = reference
	
					const targetRelation = this.map.get (targetRelationName); if (!targetRelation) throw Error (`Cannot resolve reference from ${column.relation.name}.${column.name}: "${targetRelationName}" not found`)
	
					reference.targetRelation = targetRelation
	
					if (!reference.targetColumnName) {
	
						const {pk} = targetRelation; if (!pk || pk.length !== 1) throw Error (`Cannot resolve reference from ${column.relation.name}.${column.name}: "${targetRelationName}"'s primary key must have exactly one column`)
	
						reference.targetColumnName = pk [0]
	
					}
	
					const targetColumn = targetRelation.columns [reference.targetColumnName]; if (!targetColumn) throw Error (`Cannot resolve reference from ${column.relation.name}.${column.name}: "${reference.targetRelationName}.${reference.targetColumnName}" not found`)
	
					reference.targetColumn = targetColumn
					
					column.type = targetColumn.type
					column.typeDim = targetColumn.typeDim
	
				}
	
			}

		}

	}

	createQuery (from, options) {
	
		return new DbQuery (this, from, options)
	
	}

}

DbModel.EV_OBJECTS_CREATED = EV_OBJECTS_CREATED

module.exports = DbModel