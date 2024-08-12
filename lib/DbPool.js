const {ResourcePool} = require ('doix')

class DbPool extends ResourcePool {

	constructor (o) {

		super ()
		
		this.shared.add ('model')
		this.shared.add ('lang')
		
		this.logger = o.logger

		this.on ('acquire', db => db.waitFor (this.onAcquire (db)))

	}

	async onAcquire (db) {

		// do nothing

	}

}

module.exports = DbPool