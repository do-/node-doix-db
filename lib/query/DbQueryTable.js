const DbRelation = require ('../model/DbRelation.js')
const DbQueryColumn = require ('./DbQueryColumn.js')

class DbQueryTable {

	constructor (query, src, o = {}) {

		const {model, lang} = query, {map} = model

		this.query = query
		
		this.lang = lang
				
		if (map.has (src)) {

			this.relation = map.get (src)
			
			this.src = this.relation.qName

			this.alias = o.alias || src

			const {columns} = this.relation
			
			const names = o.columns || Object.keys (columns)

			this.columns = names.map (name => columns [name].toQueryColumn (this))

		}
		else {

			this.alias = o.alias

			this.src = src

		}

		query.tables.push (this)

	}
	
	get qName () {
	
		return this.lang.quoteName (this.alias)
	
	}

}

module.exports = DbQueryTable