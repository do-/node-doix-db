module.exports = op => {

	const clazz = class {

		constructor (filters) {
		
			this.filters = filters
		
		}

		static from (filters) {

			filters = filters.filter (i => i != null)

			switch (filters.length) {

				case 0:  return null

				case 1:  return filters [0]

				default: return new clazz (filters)

			}			

		}
		
		get sql () {
			
			return '(' + this.filters.map (i => '(' + i.sql + ')').join (' ' + op + ' ') + ')'
		
		}
	
		get params () {
		
			let a = []
			
			for (const {params} of this.filters) 
			
				if (Array.isArray (params))
				
					a = a.concat (params)
		
			return a
		
		}
	
	}

	return clazz

}