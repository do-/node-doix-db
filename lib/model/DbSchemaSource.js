const {ModuleLoader} = require ('doix')
const DbObjectMerger = require ('./DbObjectMerger')

class DbSchemaSource extends Map {

	constructor (o) {
		
		super ()
		
		let loaderOptions = {}

		for (const [k, v] of Object.entries (o)) if (v !== undefined) switch (k) {

			case 'dir':
			case 'ext':
				loaderOptions [k] = v
				break

			case 'merger':
				if (!(v instanceof DbObjectMerger)) throw new Error ('Only DbObjectMerger or its descendant can be used as merger')
				this.merger = v
				break

			default:
				throw new Error ('Unknown DbObjectMap option: ' + k)

		}
	
		this.loader = new ModuleLoader (loaderOptions)
		
		if (!('merger' in this)) this.merger = new DbObjectMerger ()

	}
	
	load () {
	
		for (const [k, v] of this.loader.requireAll ()) this.set (k, v)
		
		const {merger} = this

		for (const [k, v] of this.entries ()) merger.emit ('complete', v, k)

	}
	
	set (k, v) {

		if (!this.has (k)) return super.set (k, v)
		
		this.merger.merge (super.get (k), v)
	
	}

}

module.exports = DbSchemaSource