class DbObject {
	
	constructor (o) {
	
		{
		
			const {name} = o, type = typeof name

			if (type !== 'string') throw Error (`name must be a string, not ${type}`)

			if (name.length === 0) throw Error (`name must be a non empty string`)

			const pos = name.indexOf ('.')

			if (pos < 0) {

				this.schemaName = null

				this.localName = name

			}
			else {

				this.schemaName = name.slice (0, pos)

				this.localName = name.slice (pos + 1)

			}
		
		}

		for (const k in o) this [k] = o [k]

	}
	
	setLang (lang) {

		this.qName = lang.getDbObjectName (this)

	}
		
}

module.exports = DbObject