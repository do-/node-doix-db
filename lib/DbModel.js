const DbPool      = require ('./DbPool.js')
const DbObjectMap = require ('./DbObjectMap.js')

class DbModel {

	constructor (o) {

		let mapOptions = {}

		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'dir':
			case 'ext':
			case 'merger':
			case 'detector':
				mapOptions [k] = v
				break

			case 'db':
				if (!(v instanceof DbPool)) throw new Error ('Only DbPool descendant can be used as db')
				this.db = v
				v.setModel (this)
				break

			default:
				throw new Error ('Unknown DbModel option: ' + k)

		}
	
		this.map = new DbObjectMap (mapOptions)
	
	}

	loadModules () {

		this.map.load ()

	}
	
}

module.exports = DbModel