const {EventLogger} = require ('doix')
const stringEscape  = require ('string-escape-map')

const ESC_PARAMS = new stringEscape ([
  ['\t', '\\t'],
  ['\n', '\\n'],
  ['\r', '\\r'],
  [ "'", "''"],
])

const normalizeSpace = s => {
	
	s = s.trim (); 
	
	const {length} = s; if (length === 0) return s

	let r = '', from = 0

	while (from < length) {

		let to = from + 1; while (to < length && s.charCodeAt (to) > 32) to ++

		if (r.length !== 0) r += ' '

		r += s.slice (from, to)

		from = to; while (from < length && s.charCodeAt (from) <= 32) from ++

	}

	return r
		
}

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

class DbEventLogger extends EventLogger {

	constructor (client) {

		super (client)

		this.client = client

		this.logger = client.logger

	}

	get prefix () {
	
		let {client} = this, {job} = client

		let p = job.uuid + '/' + client.uuid

		while (job = job.parent) p = job.uuid + '/' + p

		return p

	}
	
	startMessage ({sql, params}) {

		const s = '> ' + normalizeSpace (sql), p = stringifyParams (params)

		return this.message (p.length === 0 ? s : s + ' ' + p)

	}

}

DbEventLogger.normalizeSpace = normalizeSpace 
DbEventLogger.stringifyParams = stringifyParams

module.exports = DbEventLogger