const DbRelation = require ('../model/DbRelation.js')
const DbQueryColumn = require ('./DbQueryColumn.js')

class DbQueryTable {

	constructor (query, expr, o = {}) {

		const {model, lang} = query, {map} = model

		this.query = query
		
		this.lang = lang
				
		if (map.has (expr)) {

			this.relation = map.get (expr)
			
			this.expr = this.relation.qName

			this.alias = o.alias || expr

			const {columns} = this.relation
			
			const names = o.columns || Object.keys (columns)

			this.columns = names.map (name => columns [name].toQueryColumn (this))

		}
		else {

			this.alias = o.alias

			this.expr = expr

		}

		query.tables.push (this)

	}
	
	get qName () {
	
		return this.lang.quoteName (this.alias)
	
	}

}

module.exports = DbQueryTable