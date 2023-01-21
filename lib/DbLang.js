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
	
}

module.exports = DbLang