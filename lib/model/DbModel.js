const EventEmitter         = require ('events')

const DbPool               = require ('../DbPool.js')
const DbLang               = require ('../DbLang.js')
const DbObjectMap          = require ('./DbObjectMap.js')
const DbRelation           = require ('./DbRelation.js')
const DbQuery              = require ('../query/DbQuery.js')

const EV_MODULES_LOADED  = 'modules-loaded'
const EV_OBJECT_CREATED  = 'object-created'
const EV_OBJECTS_CREATED = 'objects-created'

class DbModel extends EventEmitter {

	constructor (o) {
	
		super ()

		let mapOptions = {}

		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'dir':
			case 'ext':
			case 'merger':
				mapOptions [k] = v
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

		this.map = new DbObjectMap (mapOptions)

		this.on (EV_MODULES_LOADED,  ( ) => this.createObjects ())

		this.on (EV_OBJECT_CREATED,   o  => o.setLang (this.lang))

		this.on (EV_OBJECTS_CREATED, ( ) => this.resolveReferences ())

	}
	
	loadModules () {

		this.map.load ()
		
		this.emit (EV_MODULES_LOADED)

	}
	
	createObjects () {

		const {lang} = this, map = new Map ()

		for (const [name, pojo] of this.map.entries ()) {

			pojo.name = name
			
			const o = new (lang.getDbObjectClass (pojo)) (pojo)
			
			o.model = this

			this.emit (EV_OBJECT_CREATED, o)

			map.set (o.name, o)

		}
		
		this.map = map

		this.emit (EV_OBJECTS_CREATED)

	}

	resolveReferences () {

		for (const {columns} of this.allInstancesOf (DbRelation))

			for (const column of Object.values (columns)) if ('reference' in column) {

				const {reference} = column, {targetRelationName} = reference

				const targetRelation = this.map.get (targetRelationName); if (!targetRelation) throw Error (`Cannot resolve reference from ${column.relation.name}.${column.name}: "${targetRelationName}" not found`)

				reference.targetRelation = targetRelation

				if (!reference.targetColumnName) {

					const {pk} = targetRelation; if (!pk || pk.length !== 1) throw Error (`Cannot resolve reference from ${column.relation.name}.${column.name}: "${targetRelationName}"'s primary key must have exactly one column`)

					reference.targetColumnName = pk [0]

				}
				
				const targetColumn = targetRelation.columns [reference.targetColumnName]; if (!targetColumn) throw Error (`Cannot resolve reference from ${column.relation.name}.${column.name}: "${targetRelationName}.${targetColumnName}" not found`)

				reference.targetColumn = targetColumn
				
				column.type = targetColumn.type
				column.typeDim = targetColumn.typeDim

			}

	}

	* allInstancesOf (type) {

		for (const o of this.map.values ())
		
			if (o instanceof type)

				yield o

	}
	
	createQuery (from, options) {
	
		return new DbQuery (this, from, options)
	
	}

}

DbModel.EV_MODULES_LOADED  = EV_MODULES_LOADED
DbModel.EV_OBJECT_CREATED  = EV_OBJECT_CREATED
DbModel.EV_OBJECTS_CREATED = EV_OBJECTS_CREATED

module.exports = DbModel