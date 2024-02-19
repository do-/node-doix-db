	class DbQueryNot {

		constructor (filter) {
		
			this.filter = filter
		
		}

		static from (filter) {

			if (filter === null) return null

			return new DbQueryNot (filter)

		}

		get sql () {

			return `NOT (${this.filter.sql})`

		}
	
		get params () {
		
			return this.filter.params
		
		}
	
	}

	module.exports = DbQueryNot