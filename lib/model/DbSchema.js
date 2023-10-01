class DbSchema extends require ('events') {
	
	constructor (o) {

		super ()

		for (const k in o) this [k] = o [k]
		
		this.map = new Map ()

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