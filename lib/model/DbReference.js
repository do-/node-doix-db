const CH_OPEN  = '('.charCodeAt (0)
const CH_CLOSE = ')'.charCodeAt (0)
const CH_MINUS    = '-'.charCodeAt (0)
const CH_TILDE    = '~'.charCodeAt (0)

class DbReference {

	constructor (o, column) {
	
		this.column = column
		this.on = {}
	
		if (typeof o === 'string') {
	
			this.src = o
			
			this.parse ()
					
		}
		else {
			
			for (const k in o) this [k] = o [k]
			
		}

	}
	
	parse () {

		let {src} = this, {length} = src
		
		if (length < 3)                               throw Error (`Invalid reference definition: '${src}'`)
		if (src.charCodeAt (0)          !== CH_OPEN ) throw Error (`Invalid first char in reference definition '${src}'`)
		if (src.charCodeAt (length - 1) !== CH_CLOSE) throw Error (`Invalid last char in reference definition '${src}'`)

		let start = 1
		
		switch (src.charCodeAt (1)) {

			case CH_MINUS:
				start = 2
				this.on ['DELETE'] = 'CASCADE'
				break

			case CH_TILDE:
				start = 2
				this.on ['DELETE'] = ('default' in this.column) ? 'SET DEFAULT' : 'SET NULL'
				break
		}
		
		this.targetRelationName = src.slice (start, -1).trim ()
	
	}

}

module.exports = DbReference