const DbObject = require ('./DbObject.js')

class DbTrigger extends DbObject {

	constructor (o) {

		super (o)

		this.sql = typeof this.sql === 'function' ? this.sql (this.table) : this.sql

		for (const k of ['phase', 'sql']) if (!this [k] || typeof this [k] !== 'string') throw new Error (`${k} must be a non empty string`)

		for (const k of ['options', 'action']) if (!this [k]) this [k] = ''

	}

	setLang (lang) {

		this.qName = lang.quoteName (this.name)

	}

}

module.exports = DbTrigger