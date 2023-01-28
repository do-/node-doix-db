class DbQueryColumn {

	get qName () {

		return this.query.model.lang.quoteName (this.alias)
	
	}

	check () {
	
		const {table} = this, {lang} = table.query.model
	
		if (this.name) {

			if (!this.alias) this.alias = this.name

			this.expr = table.qName + '.' + lang.quoteName (this.name)

		}
		else {

			if (!this.expr) throw Exception ('no column name nor expression is provided')

			if (!this.alias) throw Exception (`column alias not set for ${this.expr}`)

		}

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