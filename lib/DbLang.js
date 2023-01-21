const stringEscape = require ('string-escape-map')

const QQ_ESC = new stringEscape ([
  [ '"', '""'],
])

class DbLang {

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