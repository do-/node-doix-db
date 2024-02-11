module.exports = 

	class {

		constructor (filter) {
		
			this.filter = filter
		
		}

		get sql () {

			return `NOT (${this.filter.sql})`

		}
	
		get params () {
		
			return this.filter.params
		
		}
	
	}