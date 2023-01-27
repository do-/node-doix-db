const DbRelation = require ('../model/DbRelation.js')
const DbQueryColumn = require ('./DbQueryColumn.js')

class DbQueryTable {

	getColumn (alias) {

		if (!Array.isArray (this.columns)) throw Error (`columns are not properly defined in ${this.name}`)

		for (const col of this.columns) if (col.alias === alias) return col

		throw Error (`column ${alias} not found in ${this.name}`)

	}

	check () {

		const {name} = this; if (!name) throw Error ('Name is not set')

		const {query: {model}} = this, {map, lang} = model

		if (!map.has (name)) throw Error (`Relation '${name}' not found`)

		this.relation = model.map.get (name)

		if (!(this.relation instanceof DbRelation)) throw Error (`'${name}' is not a relation`)

		if (!this.alias) this.alias = name
		
		this.qName = lang.quoteName (this.alias)

		if (!this.columns) this.columns = Object.values (this.relation.columns).map (c => c.toQueryColumn ())

		for (const col of this.columns) {
		
			col.table = this
			
			col.check ()

		}

	}

}

module.exports = DbQueryTable