const DbQueryTable = require ('./DbQueryTable.js')

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

}

module.exports = DbQuery