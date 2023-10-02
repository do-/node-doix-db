const DbSchemaSource = require ('./DbSchemaSource.js')

class DbSchema extends require ('events') {
	
	constructor (o) {

		super ()

		if (!o.name) o.name = null

		if (!o.schemaName) o.schemaName = o.name

		const src = {schema: this}; for (const [k, v] of Object.entries (o)) switch (k) {

			case 'model':
			case 'schemaName':
			case 'name':
				this [k] = v
				break

			case 'root':
			case 'filter':
			case 'ext':
			case 'merger':
				src [k] = v
				break

			default:
				throw new Error ('Unknown DbSchema option: ' + k)

		}

		if (Object.keys (src).length !== 1) this.src = new DbSchemaSource (src)

		this.map = new Map ()

		const {schemaName} = this

		this.prefix = schemaName ? this.model.lang.quoteName (schemaName) + '.' : ''

	}
	
	add (name, options) {

		const {map, model} = this; if (map.has (name)) throw Error (`The schema already has the object named "${name}"`)
		
		const {lang} = model, clazz = lang.getDbObjectClass (options)

		const o = new clazz ({...options, name})

		o.model = model

		o.schema = this

		o.setLang (lang)

		this.emit ('object-created', o)

		map.set (name, o)

	}
	
}

module.exports = DbSchema