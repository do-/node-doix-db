const DbRelation = require ('./DbRelation.js')

class DbView extends DbRelation {

	constructor (o) {

		super (o)

		this.rawSql = this.sql

		for (const k of ['options', 'specification']) if (!(k in o)) this [k] = ''

		if (!('wrap' in this)) this.wrap = false

		if (typeof this.wrap !== 'boolean') throw Error (`${this.name}: wrap option must be boolean`)
		
		
	}		

	setLang (lang) {

		super.setLang (lang)
		
		if (this.wrap) lang.wrapViewSql (this)

	}

	
}

module.exports = DbView