const DbModel = require ('../model/DbModel.js')

class DbQuery {

	constructor (model) {
	
		if (!(model instanceof DbModel)) throw Error ('The 1st argument must be a DbModel')
	
		this.model = model

		this.lang = model.lang

		this.tables = []
	
	}

	check () {

		const {model} = this

		if (this.tables.length === 0) throw Error ('No relation to query from')

		const order = []

		for (const table of this.tables) {

			table.query = this

			table.check ()
			
			for (const col of table.columns) if ('ord' in col) {
				
				const {ord} = col, i = ord - 1

				if (i in order) throw Error (`Both ${order [i].qName} and ${col.qName} have ord=${ord}`)
				
				order [i] = col
			
			}

		}
		
		const {length} = order; if (length > 0) for (let i = 0; i < length; i ++) if (!order [i]) throw Error (`Column with ord=${i + 1} missing`)

		this.order = order

	}

}

module.exports = DbQuery