class DbQueryColumn {

	constructor (query, expr, alias) {
	
		this.query = query

		this.expr = expr

		this.alias = alias

		this.qName = query.lang.quoteName (alias)

		query.columns.set (alias, this)
	
	}

}

module.exports = DbQueryColumn