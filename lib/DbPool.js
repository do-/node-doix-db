const {ResourcePool} = require ('doix')
const DbCallTracker = require ('./DbCallTracker.js')

class DbPool extends ResourcePool {

	constructor (o) {

		super ()
		
		this.shared.add ('model')
		this.shared.add ('lang')
		
		this.logger = o.logger

		this.trackerClass = o.trackerClass || DbCallTracker

	}
	
}

module.exports = DbPool