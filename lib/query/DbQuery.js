const DbQueryTable = require ('./DbQueryTable.js')
const DbQueryColumn = require ('./DbQueryColumn.js')

class DbQuery {

	constructor (model, from = [], options = {}) {
		
		this.model = model

		this.lang = model.lang

		this.tables = []
		
		this.columns = new Map ()

		this.order = []
		
		this.options = options
		
		for (const [expr, o] of from) this.addTable (expr, o)
		
		if ('order' in options) for (const o of options.order) {
		
			if (Array.isArray (o)) {
				
				this.orderBy (o [0], o [1])

			}
			else {

				this.orderBy (o)

			}
		
		}

	}
	
	addTable (expr, o = {}) {
	
		return new DbQueryTable (this, expr, o)
		
	}
	
	orderBy (name, desc = false) {
	
		const col = this.columns.get (name)
		
		col.desc = desc
		
		this.order.push (col)
	
	}

	toParamsSql () {
	
		return this.lang.toParamsSql (this)
	
	}
	
	toQueryCount () {

		const q = new DbQuery (this.model)

		new DbQueryColumn (q, 'COUNT(*)', 'cnt')

		for (const table of this.tables) {

			if (table.join === 'LEFT') continue
			
			const o = {columns: [], as: table.alias}

			if (!table.isFirst) {				

				o.join = table.join

				if (table.on) o.on = table.on

			}

			const t = q.addTable (table.relation ? table.relation.name : table.expr, o)
			
			for (const f of table.filters) f.clone (t)

		}

		return q

	}

}

module.exports = DbQuery