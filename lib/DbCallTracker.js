const {LifeCycleTracker} = require ('doix')
const stringEscape  = require ('string-escape-map')

const ESC_PARAMS = new stringEscape ([
  ['\t', '\\t'],
  ['\n', '\\n'],
  ['\r', '\\r'],
  [ "'", "''"],
])

const stringifyParams = params => {
	
	if (!Array.isArray (params)) return JSON.stringify (params)
	
	if (params.length === 0) return ''

	let s = '['; for (const p of params) {
	
		if (s.length !== 1) s += ', '
		
		if (typeof p === 'string') {
		
			s += "'"
			s += ESC_PARAMS.escape (p)
			s += "'"
		
		}
		else {

			s += p

		}
	
	}
	
	return s + ']'

}

class DbCallTracker extends LifeCycleTracker {

	constructor (call) {

		const {db} = call

		super (call, db.pool.logger)

		this.call = call

		this.prefix = db.job.tracker.prefix + '/' + db.uuid + '/' + call.ord

	}
	
	startMessage () {

		const {sql, params} = this.call

		const s = super.startMessage () + ' ' + sql

		if (params.length === 0) return s

		return s + ' ' + stringifyParams (params)

	}

}

DbCallTracker.stringifyParams = stringifyParams

module.exports = DbCallTracker