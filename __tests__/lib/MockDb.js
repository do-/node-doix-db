const {Readable} = require ('stream')
const {DbClient, DbLang} = require ('../..')

const RS = [
	{id: 1, name: 'admin', label: 'System Administrator'},
	{id: 2, name: 'user',  label: 'Regular User'},
]

const COLS = Object.keys (RS [0]).map (name => ({name}))

const r = a => {

	const s = Readable.from (a)
	
	s [Symbol.for ('columns')] = COLS
	
	return s

}

module.exports = class extends DbClient {

	constructor () {
	
		super ()
		
		this.lang = new DbLang ()
	
	}

	async getStream (sql, params = [], options = {}) {

		if (!sql) return r ([])

		if (sql.indexOf ('COUNT') > -1) return r ([RS.length])

		return r (RS)

	}

}