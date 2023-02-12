class DbQueryColumn {

	constructor (query, sql, alias) {
	
		this.query = query

		this.sql = sql

		this.alias = alias

		this.qName = query.lang.quoteName (alias)

		query.columns.set (alias, this)
	
	}

}

module.exports = DbQueryColumn