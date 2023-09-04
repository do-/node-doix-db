const DbObject = require ('./DbObject.js')
const DbColumn = require ('./DbColumn.js')
const DbIndex  = require ('./DbIndex.js')

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

		if (this.keys == null) this.keys = {}

	}

	setLang (lang) {

		super.setLang (lang)
		
		for (const col of Object.values (this.columns)) col.setLang (lang)

		const {keys} = this; for (const k in keys) {

			const v = keys [k]; if (v !== null) {

				const index = new DbIndex (v, this, k)

				index.setLang (lang)
				
				keys [k] = index

			}
		
		}

	}

}

module.exports = DbRelation