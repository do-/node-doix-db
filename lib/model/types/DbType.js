class DbType {

	constructor (o) {
	
		for (const k in o) this [k] = o [k]
	
	}
	
}

module.exports = DbType