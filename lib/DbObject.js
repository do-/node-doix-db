class DbObject {
	
	constructor (o) {
	
		{
		
			const {name} = o, type = typeof name

			if (type !== 'string') throw Error (`name must be a string, not ${type}`)

			if (name.length === 0) throw Error (`name must be a non empty string`)
		
		}

		for (const k in o) this [k] = o [k]

	}
	
	setLang (lang) {

		lang.splitName (this)

		this.qName = lang.getDbObjectName (this)

	}
		
}

module.exports = DbObject