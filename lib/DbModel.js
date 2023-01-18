const DbObjectMap = require ('./DbObjectMap.js')

class DbModel {

	constructor (o) {
	
		this.map = new DbObjectMap (o)
		
		this.map.load ()
	
	}
	
}

module.exports = DbModel