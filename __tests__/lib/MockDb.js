const {DbClient, DbLang} = require ('../..')

const RS = [
	{id: 1, name: 'admin', label: 'System Administrator'},
	{id: 2, name: 'user',  label: 'Regular User'},
]

module.exports = class extends DbClient {

	constructor () {
	
		super ()
		
		this.lang = new DbLang ()
	
	}

	async getArrayBySql (sql, params = [], options = {}) {
	
		if (!sql) return []

		if (sql.indexOf ('COUNT') > -1) return [RS.length]

		if (options.maxRows === 1) return [RS [0]]

		return [...RS]

	}

}