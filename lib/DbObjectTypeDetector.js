const DbTable = require ('./DbTable.js')
const DbView  = require ('./DbView.js')

class DbObjectTypeDetector {

	getClass (o) {
	
		if (o == null) throw Error ('Empty definition')

		if (typeof o !== 'object' || Array.isArray (o)) throw Error ('Not an object')

		if (!('columns' in o)) throw Error ('Cannot detect type for ' + JSON.stringify (o))
		
		return 'sql' in o ? DbView : DbTable
	
	}
	
}

module.exports = DbObjectTypeDetector