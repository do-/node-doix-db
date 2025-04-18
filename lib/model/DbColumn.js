const DbReference = require ('./DbReference.js')

class DbColumn {

	constructor (o) {
	
		const {isReference} = o
			
		for (const k in o) if (k !== 'isReference') this [k] = o [k]

		if (isReference) {

			this.reference = new DbReference (this.type, this)
				
			this.type = undefined
	
		}	

		if (!('nullable' in this)) this.nullable = !('default' in this)
			
	}

	setLang (lang) {

		this.qName = lang.quoteName (this.name)
		
		if (this.type) {

			this.typeDef = lang.getTypeDefinition (this.type)

			this.type = this.typeDef.name

			this.typeDim = lang.getDbColumnTypeDim (this)

		}

	}

}

module.exports = DbColumn