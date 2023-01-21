const {ResourcePool} = require ('doix')
const DbEventLogger = require ('./DbEventLogger.js')

class DbPool extends ResourcePool {

	constructor (o) {

		super ()
		
		this.shared.add ('model')
		this.shared.add ('lang')
		
		this.logger = o.logger

		this.eventLoggerClass = o.eventLoggerClass || DbEventLogger

	}
	
}

module.exports = DbPool