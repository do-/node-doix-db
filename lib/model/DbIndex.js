const DbObject = require ('./DbObject.js')

class DbIndex extends DbObject {

	constructor (o, r, name) {

		if (typeof o === 'string') o = [o]
	
		if (Array.isArray (o)) o = {parts: o}
		
		if (typeof o !== 'object') throw Error ('Invalid DbIndex options')
		
		o.relation = r
		
		if (!o.name) o.name = name

		for (const k of ['options']) if (!o [k]) o [k] = []

		o.originalLocalName = o.localName

		super (o)

	}

	get schemaName () {

		return this.relation.schemaName

	}

	setLang (lang) {

		const {relation} = this

		this.localName = this.originalLocalName || lang.getIndexName (relation, this)

		super.setLang (lang)

	}

}

module.exports = DbIndex