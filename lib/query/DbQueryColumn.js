class DbQueryColumn {

	check () {
	
		const {source} = this, {lang} = source.query.model
	
		if (this.name) {

			if (!this.alias) this.alias = this.name

			this.expr = source.qName + '.' + lang.quoteName (this.name)

		}
		else {

			if (!this.expr) throw Exception ('no column name nor expression is provided')

			if (!this.alias) throw Exception (`column alias not set for ${this.expr}`)

		}

		this.qName = lang.quoteName (this.alias)

		if ('ord' in this) {

			if (!Number.isInteger (this.ord) || this.ord <= 0) throw Exception (`${source.alias}.${this.alias}: ord must be a positive integer, not '${ord}'`)
			
			this.desc = !!this.desc

		}
		else {
		
			if ('desc' in this) throw Exception (`${source.alias}.${this.alias}: 'ord' is missing, but 'desc' mentioned`)			
			
		}

	}

}

module.exports = DbQueryColumn