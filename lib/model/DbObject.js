class DbObject {
	
	constructor (o) {
	
		{
		
			const {name} = o, type = typeof name

			if (type !== 'string') throw Error (`name must be a string, not ${type}`)

			if (name.length === 0) throw Error (`name must be a non empty string`)

			this.localName = name
		
		}

		for (const k in o) this [k] = o [k]

	}

	get schemaName () {

		return 'schema' in this ? this.schema.schemaName : null

	}

	get fullName () {

		const {name} = this.schema

		return name === null ? this.name : `${name}.${this.name}`

	}
	
	setLang (lang) {

		this.qName = lang.getDbObjectName (this)

	}
		
}

module.exports = DbObject