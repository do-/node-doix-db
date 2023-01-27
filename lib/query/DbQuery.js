class DbQuery {

	constructor () {

		this.src = []
	
	}

	check () {

		const {model} = this; if (!model) throw Error ('Model is not set')

		if (this.src.length === 0) throw Error ('No reference to query from')

		const order = []

		for (const src of this.src) {

			src.query = this

			src.check ()
			
			for (const col of src.columns) if ('ord' in col) {
				
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