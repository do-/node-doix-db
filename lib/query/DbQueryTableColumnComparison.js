class DbQueryTableColumnComparison {

	constructor (table, name, op, value) {

		const {relation} = table, {columns} = relation
		
		this.table = table

		this.column = relation.columns [name]
				
		this.op = op.toUpperCase ()
				
		this.sql = table.qName + '.' + this.column.qName
		
		this.setParams (value)

	}

	get debugName () {

		return this.table.alias + '.' + this.column.name + ' ' + this.op

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

		{

			const type = typeof value

			if (type !== 'object') throw Error (`${type} value not allowed for ${this.debugName}`)

		}

		if ('sql' in value) {

			if ('params' in value) {

				const {params} = value

				if (!Array.isArray (params)) throw Error (`An Array value is required as params for ${this.debugName}`)

				this.params = params

			}
			else {
				
				this.params = []

			}			

			this.sql += ' ' + op + ' (' + value.sql + ')'

			return

		}

		if (!Array.isArray (value)) throw Error (`An Array value is required for ${this.debugName}`)

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