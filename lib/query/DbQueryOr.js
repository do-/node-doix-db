class DbQueryOr {

	constructor (filters = []) {
	
		this.filters = filters
	
	}
	
	get sql () {
	
		const {filters} = this; if (filters.length === 0) throw Error ('No one term in this search condition')

		return '(' + filters.map (i => '(' + i.sql + ')').join (' OR ') + ')'
	
	}

	get params () {
	
		let a = []
		
		for (const {params} of this.filters) 
		
			if (Array.isArray (params))
			
				a = a.concat (params)
	
		return a
	
	}

}

module.exports = DbQueryOr