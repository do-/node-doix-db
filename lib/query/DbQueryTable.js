const DbRelation = require ('../model/DbRelation.js')
const DbQuery = require ('./DbQuery.js')
const DbQueryColumn = require ('./DbQueryColumn.js')

class DbQueryTable {

	constructor (query, name, o = {}) {

		if (!(query instanceof DbQuery)) throw Error ('The 1st argument must be a DbQuery')

		const {model, lang} = query, {map} = model

		if (!map.has (name)) throw Error (`Relation '${name}' not found`)

		this.query = query
		
		this.lang = lang

		this.relation = map.get (name)
		
//		if (!(this.relation instanceof DbRelation)) throw Error (`'${name}' is not a relation`)

		this.alias = 'alias' in o ? o.alias : name
		
		{
		
			const {columns} = this.relation
			
			const names = o.columns || Object.keys (columns)

			this.columns = names.map (name => columns [name].toQueryColumn (this))

		}
		
		query.tables.push (this)

	}
	
	get qName () {
	
		return this.lang.quoteName (this.alias)
	
	}

	check () {

		for (const col of this.columns) {
		
			col.table = this

			col.query = this.query
			
			col.check ()

		}

	}

}

module.exports = DbQueryTable