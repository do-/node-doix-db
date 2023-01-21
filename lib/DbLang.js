const stringEscape = require ('string-escape-map')

const QQ_ESC = new stringEscape ([
  [ '"', '""'],
])

class DbLang {

	quoteName (s) {

		return '"' + QQ_ESC.escape (s) + '"'

	}

	splitName (o) {

		const {name} = o, pos = name.indexOf ('.')

		if (pos < 0) {

			o.schemaName = null

			o.localName = name
		
		}
		else {

			o.schemaName = name.slice (0, pos)

			o.localName = name.slice (pos + 1)

		}

	}
	
	getDbObjectName (o) {

		const {schemaName, localName} = o

		if (schemaName === null) return this.quoteName (localName)

		return this.quoteName (o.schemaName) + '.' + this.quoteName (localName)

	}

}

module.exports = DbLang