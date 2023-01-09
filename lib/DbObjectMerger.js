const util = require ('util')
const {ObjectMerger} = require ('doix')

class DbObjectMerger extends ObjectMerger {
	
	add (a, b, k) {
	
		if (k !== 'pk') return super.add (a, b, k)
		
		if (util.isDeepStrictEqual (a, b)) return a
		
		if (Array.isArray (a) && a [0] === b) return a
		if (Array.isArray (b) && b [0] === a) return b
		
		throw new Error (`Primary keys don't match: ${a} vs. ${b}`)

	}

}

module.exports = DbObjectMerger