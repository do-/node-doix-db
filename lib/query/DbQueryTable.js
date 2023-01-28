const DbRelation = require ('../model/DbRelation.js')
const DbQuery = require ('./DbQuery.js')
const DbQueryColumn = require ('./DbQueryColumn.js')

class DbQueryTable {

	constructor (query, src, o = {}) {

		if (!(query instanceof DbQuery)) throw Error ('The 1st argument must be a DbQuery')

		const {model, lang} = query, {map} = model

		this.query = query
		
		this.lang = lang
		
		this.src = src
		
		if (map.has (src)) {

			this.relation = map.get (src)
			
			this.alias = o.alias || src

			const {columns} = this.relation
			
			const names = o.columns || Object.keys (columns)

			this.columns = names.map (name => columns [name].toQueryColumn (this))

		}
		else {

			this.alias = o.alias

		}

		query.tables.push (this)

	}
	
	get qName () {
	
		return this.lang.quoteName (this.alias)
	
	}

}

module.exports = DbQueryTable