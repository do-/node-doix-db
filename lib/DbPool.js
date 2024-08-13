const {ResourcePool} = require ('doix')

class DbPool extends ResourcePool {

	constructor (o) {

		super ()

		this.shared.add ('model')
		this.shared.add ('lang')
		
		this.logger = o.logger

	}

}

module.exports = DbPool