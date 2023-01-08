const CH_ROUND_CLOSE = ')'.charCodeAt (0)
const CH_CURLY_CLOSE = '}'.charCodeAt (0)
const CH_SLASH = '/'.charCodeAt (0)
const CH_BACK_SLASH = '\\'.charCodeAt (0)

const RE_INT = /^[1-9][0-9]*$/

class DbColumn {

	constructor (o) {
	
		if (typeof o === 'string') {
	
			this.src = o
			
			this.parse ()
					
		}
		else {
			
			for (const k in o) this [k] = o [k]
			
		}

	}
	
	parse () {
	
		const {src} = this, pos = src.lastIndexOf ('//')
		
		if (pos < 0) {

			this.type = src.trim ()

		}
		else {

			this.type    = src.slice (0, pos).trim ()
			
			this.comment = src.slice (pos + 2).trim ()

		}
		
		this.parseDefault ()
		this.parsePattern ()
		this.parseRange ()
		this.parseDimension ()
	
	}

	parseDefault () {

		const pos = this.type.indexOf ('='); if (pos < 0) return
		
		this.default = this.type.slice (pos + 1).trim ()

		this.type = this.type.slice (0, pos).trim ()

	}
	
	parsePattern () {

		const last = this.default ? 'default' : 'type', src = this [last]

		let pos = src.length - 1; if (src.charCodeAt (pos) !== CH_SLASH) return

		while (true) {

			pos = src.lastIndexOf ('/', pos - 1)

			if (pos < 0) throw Error (`Invalid column definition: cannot find opening '/' for pattern in '${this.src}'`)

			if (pos === 0) throw Error (`Invalid column definition: the ${last} is empty in '${this.src}'`)

			if (src.charCodeAt (pos - 1) !== CH_BACK_SLASH) break
			
		}
		
		this.pattern = src.slice (pos + 1, -1)
		
		this [last] = src.slice (0, pos).trim ()
	
	}

	parseRange () {

		const last = this.default ? 'default' : 'type', src = this [last]

		if (src.charCodeAt (src.length - 1) !== CH_CURLY_CLOSE) return

		const begin = src.lastIndexOf ('{'); if (begin < 0) throw Error (`Invalid column definition: cannot find opening '{' for range in '${this.src}'`)

		const range = src.slice (begin + 1, -1)

		this [last] = src.slice (0, begin).trim ()

		const pos = range.indexOf ('..'); if (pos < 0) throw Error (`Invalid column definition: cannot find '..' between '{' and '}' in '${this.src}'`)
		
		const min = range.slice (0, pos).trim (); if (min.length !== 0) this.min = min

		const max = range.slice (pos + 2).trim (); if (max.length !== 0) this.max = max

	}
	
	parseDimension () {

		const src = this.type

		if (src.charCodeAt (src.length - 1) !== CH_ROUND_CLOSE) return

		const begin = src.lastIndexOf ('('); if (begin < 0) throw Error (`Invalid column definition: cannot find opening '(' for dimension in '${this.src}'`)

		let dimension = src.slice (begin + 1, -1)

		this.type = src.slice (0, begin).trim ()

		const pos = dimension.indexOf (','); if (pos >= 0) {
		
			const scale = dimension.slice (pos + 1).trim ()

			if (!RE_INT.test (scale)) throw Error (`Invalid column definition: not a positive integer as scale in '${this.src}'`)
		
			this.scale = parseInt (scale)
			
			dimension = dimension.slice (0, pos).trim ()
		
		}

		if (!RE_INT.test (dimension)) throw Error (`Invalid column definition: not a positive integer as column dimension in '${this.src}'`)

		this.size = parseInt (dimension)

	}

}

module.exports = DbColumn