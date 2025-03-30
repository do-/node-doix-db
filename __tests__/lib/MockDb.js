const Path = require ('path')
const {Readable} = require ('stream')
const {Application} = require ('doix')
const {DbClient, DbLang, DbModel, DbPool} = require ('../..')
const {Tracker}  = require ('events-to-winston')
const {Writable} = require ('stream')
const winston = require ('winston')
const logger = winston.createLogger({
	transports: [
//	  new winston.transports.Console (),
	  new winston.transports.Stream ({stream: new Writable ({write(){}})})
	]
})

const pool = new DbPool ({logger})

const src = Path.join (__dirname, '..', 'data', 'root1')

const RS = [
	{id: 1, name: 'admin', label: 'System Administrator'},
	{id: 2, name: 'user',  label: 'Regular User'},
]

const COLS = Object.keys (RS [0]).map (name => ({name}))

const app = new Application ({
	modules: {dir: {root: __dirname}}, logger
})

module.exports = class extends DbClient {

	constructor () {
	
		jest.resetModules ()

		super ()

		this.name = 'db'

		this.app = app

		this.job = {[Tracker.LOGGING_ID]: '1/2'}

		this.pool = pool
		
		this.lang = new DbLang ()

		this.model = new DbModel ({src: [
			{root: src},
			{name: 'log'},
		]})

		this.model.db = this

		this.model.loadModules ()

		this.model.getSchema ('log').add ('pro', {body: ''})

		this.lang.model = this.model
	
	}

	async exec (cl) {

		if (!cl.sql) throw Error ('Empty SQL')

		cl.rows = 
			cl.options.maxRows === 3 ? RS 
			: cl.sql === '0' ? []
			: cl.sql === 'SELECT NULL' ? [[null]]
			: cl.sql.indexOf ('COUNT') > -1 ? [[RS.length]]
			: Readable.from (RS)

		cl.columns = COLS

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
					old_slack: {type: 'text', comment: 'A column to drop'},			
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