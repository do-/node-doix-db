const stringEscape = require ('string-escape-map')

const DbTable = require ('./DbTable.js')
const DbView  = require ('./DbView.js')

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
	
	getDbObjectName (o) {

		const {schemaName, localName} = o

		if (schemaName === null) return this.quoteName (localName)

		return this.quoteName (o.schemaName) + '.' + this.quoteName (localName)

	}

}

module.exports = DbLang