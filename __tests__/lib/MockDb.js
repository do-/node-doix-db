const Path = require ('path')
const {Readable} = require ('stream')
const {DbClient, DbLang, DbModel, DbTable} = require ('../..')

const root = () => ['root1'].map (i => Path.join (__dirname, '..', 'data', i))

const dir = {
	root: root (),
	live: false,
}

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
	
		jest.resetModules ()

		super ()
		
		this.lang = new DbLang ()

		this.model = new DbModel ({dir})

		this.model.loadModules ()
	
	}

	async getStream (sql, params = [], options = {}) {

		if (!sql) return r ([])
		
		if (sql === 'SELECT NULL') return r ([Symbol.for ('NULL')])

		if (sql.indexOf ('COUNT') > -1) return r ([RS.length])

		return r (RS)

	}
	
	async getStreamOfExistingTables () {
	
		return Readable.from ([

			new DbTable ({name: 'users', columns: {id: 'int'}, pk: ['id']}),
			
			new DbTable ({name: '__alien', columns: {id: 'int'}, pk: ['id']}),

		])
	
	}

}