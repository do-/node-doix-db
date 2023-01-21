const EventEmitter         = require ('events')

const DbPool               = require ('./DbPool.js')
const DbObjectMap          = require ('./DbObjectMap.js')
const DbObjectTypeDetector = require ('./DbObjectTypeDetector')

const EV_MODULES_LOADED  = 'modules-loaded'
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

			case 'detector':
				if (!(v instanceof DbObjectTypeDetector)) throw new Error ('Only DbObjectTypeDetector or its descendant can be used as detector')
				this.detector = v
				break

			case 'db':
				if (!(v instanceof DbPool)) throw new Error ('Only DbPool descendant can be used as db')
				this.db = v
				v.model = this
				break

			default:
				throw new Error ('Unknown DbModel option: ' + k)

		}

		if (!('detector' in this)) this.detector = new DbObjectTypeDetector ()
	
		this.map = new DbObjectMap (mapOptions)
		
		this.on (EV_MODULES_LOADED, () => this.createObjects ())

	}
	
	loadModules () {

		this.map.load ()
		
		this.emit ('modules-loaded')

	}
	
	createObjects () {
	
		const {detector} = this, map = new Map ()

		for (const [name, pojo] of this.map.entries ()) {

			pojo.name = name

			const o = detector.create (pojo)

			map.set (o.name, o)

		}
		
		this.map = map

		this.emit ('objects-created')

	}

}

DbModel.EV_MODULES_LOADED  = EV_MODULES_LOADED
DbModel.EV_OBJECTS_CREATED = EV_OBJECTS_CREATED

module.exports = DbModel