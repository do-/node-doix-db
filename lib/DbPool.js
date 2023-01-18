const {ResourcePool} = require ('doix')
const DbEventLogger = require ('./DbEventLogger.js')

class DbPool extends ResourcePool {

	constructor (o) {

		super ()
		
		this.globals = {}

		this.logger = o.logger

		this.eventLoggerClass = o.eventLoggerClass || DbEventLogger

	}
	
	setModel (m) {
	
		this.model = m

		this.globals.model = m
	
	}
	
}

module.exports = DbPool