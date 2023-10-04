const Path = require ('path')
const {Readable} = require ('stream')
const {DbClient, DbLang, DbModel, DbTable} = require ('../..')

const src = Path.join (__dirname, '..', 'data', 'root1')

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

		this.model = new DbModel ({src: [
			{root: src},
			{name: 'log'},
		]})

		this.model.loadModules ()
	
	}

	async getStream (sql, params = [], options = {}) {

		if (!sql) return r ([])
		
		if (sql === 'SELECT NULL') return r ([Symbol.for ('NULL')])

		if (sql.indexOf ('COUNT') > -1) return r ([RS.length])

		return r (RS)

	}
	
	async getStreamOfExistingTables () {

		const {model} = this, {defaultSchema} = model

		const tables = [

			{
				name: 'users', 
				columns: {
					uuid: {type: 'uuid', comment: 'PK'}, 
					label: {type: 'text', comment: 'Human Readable Label'}, 
					is_actual: {type: 'boolean', comment: 'Is actual ?'}, 
				}, 
				pk: ['uuid']
			},
			
			{name: '__alien', columns: {id: 'int'}, pk: ['id']},

		].map (o => defaultSchema.create (o))

		tables.push (model.getSchema ('log').create (
			{name: '__alien', columns: {id: 'int'}, pk: ['id']},
		))
	
		return Readable.from (tables)
	
	}

	async getStreamOfExistingViews () {
	
		return Readable.from ([])
	
	}

	async getStreamOfExistingThings () {
	
		return Readable.from ([])
	
	}

}