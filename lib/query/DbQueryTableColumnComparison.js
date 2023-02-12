class DbQueryTableColumnComparison {

	constructor (table, name, op, value) {

		this.table = table
		
		this.column = table.relation.columns [name]
				
		this.op = op.toUpperCase ()
				
		this.sql = table.qName + '.' + this.column.qName
		
		this.setParams (value)

		table.filters.push (this)

	}
	
	clone (table) {
	
		const result = new DbQueryTableColumnComparison (table, this.column.name, this.op, this.params)
		
		result.sql   = this.sql

		result.params = this.params
		
		return result
	
	}
	
	setParams (value) {

		const {op, table} = this, {lang} = table

		if (lang.isUnaryOperator (op)) {
		
			this.params = []
			
			this.sql += ' ' + op
			
			return
			
		}
/*
		if (value instanceof DbQuery) {

			this.params = lang.toParamsSql (query)

			this.sql += ' (' + params.pop () + ')'
			
			return

		}
*/
		if (this.op !== 'IN' && this.op !== 'NOT IN') {

			this.params = Array.isArray (value) ? value : [value]
			
			const right = lang.genComparisonRightPart (this)
			
			if (right !== null) this.sql += ' ' + op + ' ' + right

			return

		}

		if (!Array.isArray (value)) throw Error (`An Array value is required for ${op}`)

		if (value.length === 0) {

			this.params = []

			this.sql = this.op === 'IN' ? '0=1' : '0=0'

		}
		else {
		
			this.params = value

			this.sql += ' ' + op + ' '
			this.sql += lang.genComparisonRightPart (this)

		}

	}

}

module.exports = DbQueryTableColumnComparison