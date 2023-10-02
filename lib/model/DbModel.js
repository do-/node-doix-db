const EventEmitter         = require ('events')

const DbPool               = require ('../DbPool.js')
const DbLang               = require ('../DbLang.js')
const DbRelation           = require ('./DbRelation.js')
const DbSchema             = require ('./DbSchema.js')
const DbQuery              = require ('../query/DbQuery.js')

const EV_OBJECTS_CREATED = 'objects-created'

class DbModel extends EventEmitter {

	constructor (o) {
	
		super ()

		this.schemata = new Map ()

		let src = []; for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'src':
				if (!Array.isArray (v)) src.push (v); else src = v
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

		for (const s of src)  this.addSchema (s)

		if (!this.schemata.has (null)) this.addSchema ()

		this.on (EV_OBJECTS_CREATED, () => this.resolveReferences ())

	}

	addSchema (o = {}) {

		if (typeof o === 'string') o = {root: [o]}

		if (!o.name) o.name = null

		if (this.schemata.has (o.name)) throw Error (`DbModel: the schema called ${o.name} is already registered`)

		if (!o.schemaName) o.schemaName = o.name

		for (const {schemaName} of this.schemata.values ()) if (o.schemaName === schemaName) throw Error (`DbModel: the physical name ${schemaName} is already in use`)

		o.model = this

		this.schemata.set (o.name, new DbSchema (o))

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

	find (name) {

		if (this.map.has (name)) return this.map.get (name)

		const dot = name.indexOf ('.'); if (dot < 1) return undefined

		const schema = this.getSchema (name.slice (0, dot)); if (!schema) return undefined

		return schema.map.get (name.slice (dot + 1)) || undefined

	}

	resolveReferences () {

		for (const schema of this.schemata.values ()) {

			for (const object of schema.map.values ()) if (object instanceof DbRelation) {

				for (const column of Object.values (object.columns)) if ('reference' in column) {

					const {reference} = column, {targetSchemaName, targetRelationName} = reference

					const targetSchema = targetSchemaName === undefined ? schema : this.getSchema (targetSchemaName); if (!targetSchema) throw Error (`Cannot resolve reference from ${column.relation.name}.${column.name}: schema "${targetSchemaName}" not found`)

					reference.targetSchema = targetSchema
	
					const targetRelation = targetSchema.map.get (targetRelationName); if (!targetRelation) throw Error (`Cannot resolve reference from ${column.relation.name}.${column.name}: "${targetRelationName}" not found`)
	
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