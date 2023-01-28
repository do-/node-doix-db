class DbQueryColumn {

	constructor (query, expr, alias) {
	
		this.query = query

		this.expr = expr

		this.alias = alias

		this.qName = query.lang.quoteName (alias)

		query.columns.set (alias, this)
	
	}

	check () {
	
		const {table} = this, {lang} = table.query.model
	
		if ('ord' in this) {

			if (!Number.isInteger (this.ord) || this.ord <= 0) throw Exception (`${table.alias}.${this.alias}: ord must be a positive integer, not '${ord}'`)
			
			this.desc = !!this.desc

		}
		else {
		
			if ('desc' in this) throw Exception (`${table.alias}.${this.alias}: 'ord' is missing, but 'desc' mentioned`)			
			
		}

	}

}

module.exports = DbQueryColumn