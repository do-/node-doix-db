const DbTypeArithmetic = require ('./DbTypeArithmetic.js')

class DbTypeArithmeticInt extends DbTypeArithmetic {

	constructor (o) {
	
		super (o)
		
		if (!('isSigned' in this)) this.isSigned = true
	
	}

}

module.exports = DbTypeArithmeticInt