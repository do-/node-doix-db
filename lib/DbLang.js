const stringEscape = require ('string-escape-map')

const DbTable = require ('./model/DbTable.js')
const DbView  = require ('./model/DbView.js')

const QQ_ESC = new stringEscape ([
  [ '"', '""'],
])

class DbLang {

	getDbObjectClass (o) {
	
		if (o == null) throw Error ('Empty definition')

		if (typeof o !== 'object' || Array.isArray (o)) throw Error ('Not an object')

		if (!('columns' in o)) throw Error ('Cannot detect type for ' + JSON.stringify (o))
		
		return 'sql' in o ? DbView : DbTable
	
	}

	quoteName (s) {

		return '"' + QQ_ESC.escape (s) + '"'

	}
	
	getCanonicalTypeName (type) {
	
		return type.toUpperCase ()
	
	}
	
	getDbObjectName (o) {

		const {schemaName, localName} = o

		if (schemaName === null) return this.quoteName (localName)

		return this.quoteName (o.schemaName) + '.' + this.quoteName (localName)

	}
		
	getDbColumnTypeDim (col) {

		if (!('size' in col)) return col.type

		let s = col.type + '(' + col.size

		if ('scale' in col) s += ',' + col.scale
		
		return s + ')'

	}
	
	genCreateMockView ({qName, columns}) {

		return 'CREATE VIEW ' + qName + ' AS SELECT ' + Object.values (columns)

			.map (({qName, typeDim}) => `CAST (NULL AS ${typeDim}) AS ${qName}`)

	}

}

module.exports = DbLang