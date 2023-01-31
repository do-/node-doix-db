class DbQueryTableColumnComparison {

	constructor (table, name, op, value) {

		this.table = table
		
		this.column = table.relation.columns [name]
				
		this.op = op.toUpperCase ()
				
		this.expr = table.qName + '.' + this.column.qName + ' ' + op
		
		this.setParams (value)

		table.filters.push (this)

	}
	
	setParams (value) {

		const {op, table} = this, {lang} = table

		if (lang.isUnaryOperator (op)) {
		
			this.params = []
			
			return
			
		}
/*
		if (value instanceof DbQuery) {

			this.params = lang.toParamsSql (query)

			this.expr += ' (' + params.pop () + ')'
			
			return

		}
*/
		if (this.op !== 'IN' && this.op !== 'NOT IN') {

			this.params = Array.isArray (value) ? value : [value]

			this.expr += ' '
			this.expr += lang.genComparisonRightPart (this)

			return

		}

		if (!Array.isArray (value)) throw Error (`An Array value is required for ${op}`)

		if (value.length === 0) {

			this.params = []

			this.expr = this.op === 'IN' ? '0=1' : '0=0'

		}
		else {
		
			this.params = value

			this.expr += ' '
			this.expr += lang.genComparisonRightPart (this)

		}

	}

}

module.exports = DbQueryTableColumnComparison