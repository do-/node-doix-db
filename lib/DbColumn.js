const CH_PARANT_CLOSE = '}'.charCodeAt (0)
const CH_SLASH = '/'.charCodeAt (0)
const CH_BACK_SLASH = '\\'.charCodeAt (0)

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
			
			if (pos === 0) break
			
			if (src.charCodeAt (pos - 1) !== CH_BACK_SLASH) break
			
		}
		
		this.pattern = src.slice (pos + 1, -1)
		
		this [last] = src.slice (0, pos).trim ()
	
	}

	parseRange () {

		const last = this.default ? 'default' : 'type', src = this [last]

		if (src.charCodeAt (src.length - 1) !== CH_PARANT_CLOSE) return

		const begin = src.lastIndexOf ('{'); if (begin < 0) throw Error (`Invalid column definition: cannot find opening '{' for range in '${this.src}'`)

		const range = src.slice (begin + 1, -1)

		this [last] = src.slice (0, begin).trim ()

		const pos = range.indexOf ('..'); if (pos < 0) throw Error (`Invalid column definition: cannot find '..' between '{' and '}' in '${this.src}'`)
		
		const min = range.slice (0, pos).trim (); if (min.length !== 0) this.min = min

		const max = range.slice (pos + 2).trim (); if (max.length !== 0) this.max = max

	}

}

module.exports = DbColumn