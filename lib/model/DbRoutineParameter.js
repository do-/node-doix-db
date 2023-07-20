const CH_EQ    = '='.charCodeAt (0)
const CH_SPACE = ' '.charCodeAt (0)
const MODES    = ['OUT', 'INOUT', 'IN']

class DbRoutineParameter {

	constructor (o) {
	
		if (typeof o === 'string') {
				
			if (o.length === 0) throw Error (`DbRoutineParameter DSL source must be a non empty string`)

			this.parse (o)
					
		}
		else {
		
			for (const k of ['name', 'type']) {
			
				const v = o [k]
				
				if (!v || typeof v !== 'string') throw Error (`DbRoutineParameter ${k} must be a non empty string`)
				
			}
		
			for (const k in o) this [k] = o [k]
						
			if (!this.mode) this.mode = 'IN'
			
		}
		
	}

	parse (src) {
	
		const bkp = src
	
		for (const mode of MODES) {
		
			const {length} = mode; if (src.charCodeAt (length) !== CH_SPACE) continue
			
			if (src.slice (0, length) !== mode) continue
			
			this.mode = mode
			
			src = src.slice (length).trim ()
			
			break
		
		}
		
		if (!('mode' in this)) this.mode = 'IN'
		
		{

			const eq = src.indexOf ('='); if (eq !== -1) {

				this.default = src.slice (eq + 1).trim ()

				src = src.slice (0, eq).trim ()

			}
		
		}

		{

			const sp = src.indexOf (' '); if (sp === -1) throw Error (`Invalid parameter definition: "${bkp}"`)

			this.name = src.slice (0, sp).trim ()
			
			this.type = src.slice (sp).trim ()
		
		}

	}

	setLang (lang) {

		this.qName = lang.quoteName (this.name)
		
	}

}

module.exports = DbRoutineParameter