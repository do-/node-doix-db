const DbQueryTable = require ('./DbQueryTable.js')
const DbQueryColumn = require ('./DbQueryColumn.js')

class DbQuery {

	constructor (model, from = []) {
		
		this.model = model

		this.lang = model.lang

		this.tables = []
		
		this.columns = new Map ()

		this.order = []
		
		for (const [expr, o] of from) this.addTable (expr, o)

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

			q.addTable (table.relation ? table.relation.name : table.expr, o)

		}

		return q

	}

}

module.exports = DbQuery