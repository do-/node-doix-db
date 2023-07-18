const DbObject = require ('./DbObject.js')
const DbRoutineParameter = require ('./DbRoutineParameter.js')

class DbRoutine extends DbObject {

	constructor (o) {

		for (const k of ['body']) if (!(k in o)) throw Error (`${k} is not defined`)

		for (const k of ['parameters', 'options']) {
		
			if (o [k] == null) {
				
				o [k] = []
			
			}
			else if (!Array.isArray (o [k])) {
			
				throw Error (`When defined, ${k} must be an array`)
				
			}
			
		}

		o.parameters = o.parameters.map (o => new DbRoutineParameter (o))

		super (o)

	}

	setLang (lang) {

		super.setLang (lang)
		
		for (const parameter of this.parameters) parameter.setLang (lang)

	}
	
}

module.exports = DbRoutine