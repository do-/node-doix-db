const {ResourcePool} = require ('doix')

class DbPool extends ResourcePool {

	constructor (o) {

		super (o)

		this.shared.add ('model')
		this.shared.add ('lang')

	}

}

module.exports = DbPool