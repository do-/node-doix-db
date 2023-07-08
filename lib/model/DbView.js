const DbRelation = require ('./DbRelation.js')

class DbView extends DbRelation {

	constructor (o) {

		super (o)

		for (const k of ['options', 'specification']) if (!(k in o)) this [k] = ''
		
	}		
	
}

module.exports = DbView