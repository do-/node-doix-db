const {ModuleLoader} = require ('doix')
const DbObjectMerger = require ('./DbObjectMerger')

class DbSchemaSource extends Map {

	constructor (o) {
		
		super ()
		
		let loaderOptions = {}

		let {root, filter} = o; if (!root) throw Error (`DbSchemaSource: root must be provided`)

		if (!Array.isArray (root)) root = [root]

		o.dir = {root}

		if (filter) o.dir.filter = filter

		for (const [k, v] of Object.entries (o)) switch (k) {

			case 'root':
			case 'filter':
				break

			case 'schema':
				this.schema = v
				break

			case 'dir':
			case 'ext':
				loaderOptions [k] = v
				break

			case 'merger':
				if (!(v instanceof DbObjectMerger)) throw new Error ('Only DbObjectMerger or its descendant can be used as merger')
				this.merger = v
				break

			default:
				throw new Error ('Unknown DbSchemaSource option: ' + k)

		}
	
		this.loader = new ModuleLoader (loaderOptions)
		
		if (!('merger' in this)) this.merger = new DbObjectMerger ()

	}
	
	load () {
	
		for (const [k, v] of this.loader.requireAll ()) this.set (k, v)
		
		const {merger} = this

		for (const [k, v] of this.entries ()) merger.emit ('complete', v, k)

		const {schema} = this

		for (const [k, v] of this.entries ()) schema.add (k, v)

	}
	
	set (k, v) {

		if (!this.has (k)) return super.set (k, v)
		
		this.merger.merge (super.get (k), v)
	
	}

}

module.exports = DbSchemaSource