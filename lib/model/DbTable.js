const DbRelation = require ('./DbRelation.js')
const DbTrigger = require ('./DbTrigger.js')

class DbTable extends DbRelation {

	constructor (o) {

		super (o)

		if (typeof this.data === 'function') this.data = this.data ()

		if (this.triggers == null) {

			this.triggers = []

		}
		else if (!Array.isArray (this.triggers)) {

			throw Error (`triggers must be specified as an array`)

		}		

	}

	setLang (lang) {

		super.setLang (lang)
		
		const {triggers} = this, {length} = triggers
		
		for (let i = 0; i < length; i ++) {
		
			const o = triggers [i]
			
			o.table = this
		
			if (!o.name) o.name = lang.getTriggerName (this, i)
			
			const trigger = new DbTrigger (o)
			
			trigger.setLang (lang)

			triggers [i] = trigger
					
		}

	}

}

module.exports = DbTable