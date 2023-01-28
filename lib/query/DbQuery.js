const DbModel = require ('../model/DbModel.js')

class DbQuery {

	constructor (model) {
	
		if (!(model instanceof DbModel)) throw Error ('The 1st argument must be a DbModel')
	
		this.model = model

		this.lang = model.lang

		this.tables = []
		
		this.columns = new Map ()

		this.order = []

	}
	
	orderBy (name, desc = false) {
	
		const col = this.columns.get (name)
		
		col.desc = desc
		
		this.order.push (col)
	
	}

}

module.exports = DbQuery