const DbQueryTable = require ('./DbQueryTable.js')

class DbQuery {

	constructor (model) {
		
		this.model = model

		this.lang = model.lang

		this.tables = []
		
		this.columns = new Map ()

		this.order = []

	}
	
	addTable (src, o = {}) {
	
		return new DbQueryTable (this, src, o)
		
	}
	
	orderBy (name, desc = false) {
	
		const col = this.columns.get (name)
		
		col.desc = desc
		
		this.order.push (col)
	
	}

}

module.exports = DbQuery