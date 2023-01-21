const DbObject = require ('./DbObject.js')
const DbColumn = require ('./DbColumn.js')

class DbRelation extends DbObject {

	constructor (o) {

		for (const k of ['columns']) if (!(k in o)) throw Error (`${k} is not defined`)

		super (o)
				
		const {columns} = this; if (typeof columns !== 'object') throw Error (`columns must be specified as an object`)

		for (const [name, src] of Object.entries (columns)) {

			const column = new DbColumn (src)
					
			column.name = name
			column.relation = this

			columns [name] = column

		}
		
		if (this.pk == null) {

			this.pk = []

		}
		else if (!Array.isArray (this.pk)) {

			this.pk = [this.pk]

		}

		for (const name of this.pk) {
		
			if (!(name in columns)) throw Error (`PK column not defined: ${name}`)
			
			columns [name].nullable = false
			
		}

	}
	
}

module.exports = DbRelation