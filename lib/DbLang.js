const stringEscape = require ('string-escape-map')

const QQ_ESC = new stringEscape ([
  [ '"', '""'],
])

class DbLang {

	quoteName (s) {

		return '"' + QQ_ESC.escape (s) + '"'

	}

}

module.exports = DbLang