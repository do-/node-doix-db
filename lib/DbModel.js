const EventEmitter         = require ('events')

const DbPool               = require ('./DbPool.js')
const DbLang               = require ('./DbLang.js')
const DbObjectMap          = require ('./DbObjectMap.js')

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
	
		this.map = new DbObjectMap (mapOptions)
		
		this.on (EV_MODULES_LOADED, () => this.createObjects ())
		
		if ('db' in this) {
		
			const {lang} = this.db
		
			this.on (EV_OBJECT_CREATED, o => o.setLang (lang))

		}

	}
	
	loadModules () {

		this.map.load ()
		
		this.emit (EV_MODULES_LOADED)

	}
	
	createObjects () {

		if (!('lang' in this)) this.lang = 'db' in this ? this.db.lang : new DbLang ()

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

	* allInstancesOf (type) {

		for (const o of this.map.values ())
		
			if (o instanceof type)

				yield o

	}

}

DbModel.EV_MODULES_LOADED  = EV_MODULES_LOADED
DbModel.EV_OBJECT_CREATED  = EV_OBJECT_CREATED
DbModel.EV_OBJECTS_CREATED = EV_OBJECTS_CREATED

module.exports = DbModel