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

class DbEventLogger extends LifeCycleTracker {

	constructor (client) {

		super (client, client.logger)

		this.client = client

		let {job} = client

		let p = job.uuid + '/' + client.uuid

		while (job = job.parent) p = job.uuid + '/' + p

		this.prefix = p

	}
	
	startMessage ({sql, params}) {

		const s = super.startMessage () + ' ' + sql, p = stringifyParams (params)

		return p.length === 0 ? s : s + ' ' + p

	}

}

DbEventLogger.stringifyParams = stringifyParams

module.exports = DbEventLogger