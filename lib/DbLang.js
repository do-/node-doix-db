const stringEscape = require ('string-escape-map')

const DbTable = require ('./model/DbTable.js')
const DbView  = require ('./model/DbView.js')

const CH_Q = "'", CH_QQ = '"'

const Q_ESC = new stringEscape ([
  [CH_Q,  CH_Q + CH_Q],
])

const QQ_ESC = new stringEscape ([
  [CH_QQ, CH_QQ + CH_QQ],
])

const DELIM_UPDATE = [',', ' AND ']

class DbLang {

	getDbObjectClass (o) {
	
		if (o == null) throw Error ('Empty definition')

		if (typeof o !== 'object' || Array.isArray (o)) throw Error ('Not an object')

		if (!('columns' in o)) throw Error ('Cannot detect type for ' + JSON.stringify (o))
		
		return 'sql' in o ? DbView : DbTable
	
	}

	getDbObjectClassesToDiscover () {
	
		return [DbTable]
	
	}
	
	getRequiredMutation (asIs, toBe) {
	
		return null
	
	}

	quoteName (s) {

		return CH_QQ + QQ_ESC.escape (s) + CH_QQ

	}

	quoteStringLiteral (s) {

		return CH_Q + Q_ESC.escape (s) + CH_Q

	}
	
	quoteLiteral (v) {

		if (v === null) return 'NULL'
		
		switch (typeof v) {
		
			case 'string': 
				return this.quoteStringLiteral (v)
			
			case 'number': 
			case 'bigint': 
				return '' + v

			case 'boolean': 
				return v ? 'TRUE' : 'FALSE'

			case 'undefined': 
				return 'NULL'
				
			default:
				throw Error ('Cannot serialize ' + v)
		
		}

	}	
	
	getCanonicalTypeName (type) {
	
		return type.toUpperCase ()
	
	}
	
	getDbObjectName (o) {

		const {schemaName, localName} = o

		if (schemaName === null) return this.quoteName (localName)

		return this.quoteName (o.schemaName) + '.' + this.quoteName (localName)

	}
		
	getDbColumnTypeDim (col) {

		if (!('size' in col)) return col.type

		let s = col.type + '(' + col.size

		if ('scale' in col) s += ',' + col.scale

		return s + ')'

	}
	
	isUnaryOperator (op) {

		switch (op) {

			case 'IS NULL':
			case 'IS NOT NULL':
				return true

			default:
				return false

		}

	}

	genComparisonRightPart (filter) {
		
		switch (filter.op) {

			case 'ILIKE':
				filter.sql = 'UPPER(' + filter.sql + ') LIKE UPPER(?)'
				return null

			case 'NOT ILIKE':			
				filter.sql = 'UPPER(' + filter.sql + ') NOT LIKE UPPER(?)'
				return null

			case '=':
			case '<':
			case '>':
			case '<=':
			case '>=':
			case '<>':
			case 'LIKE':
			case 'NOT LIKE':
				return '?'

			case 'BETWEEN':
				return '? AND ?'

			case 'IN':
			case 'NOT IN':
				return '(?' + ',?'.repeat (filter.params.length - 1) + ')'

			default:
				throw Error ('Unknown comparison operator: ' + op)

		}
	
	}

	genSelectObjectParamsSql (sqlOrName, params) {
			
		if (!Array.isArray (params)) params = [params]

		const {map} = this.model || {}; if (map && map.has (sqlOrName)) {

			const {qName, pk, columns} = map.get (sqlOrName)

			let filter = ''; for (const name of pk) {

				if (filter.length !== 0) filter += ' AND '

				filter += columns [name].qName + '=?'

			}

			params.push (`SELECT * FROM ${qName} WHERE ${filter}`)

		}
		else {
		
			params.push (sqlOrName)
		
		}

		return params

	}
	
	genInsertParamsSql (name, data) {

		const {model} = this; if (!model) throw Error ('Model not set')

		const {map} = model; if (!map.has (name)) throw Error ('Entity not defined: ' + name)

		const {pk, columns, qName} = map.get (name)

		let sql = '', params = []
		
		for (const [k, v] of Object.entries (data)) {

			if (v === undefined) continue

			if (!(k in columns)) continue

			const {qName, nullable} = columns [k]
			
			if (sql.length !== 0) sql += ','

			sql += qName
			
			params.push (v)

		}
		
		const {length} = params; 
		
		if (length === 0) {

			sql = 'DEFAULT VALUES'

		}
		else {

			sql = `(${sql}) VALUES (?`
			
			if (length !== 1) sql += ',?'.repeat (length - 1)
			
			sql += ')'

		}
		
		params.push (`INSERT INTO ${qName} ${sql}`)
		
		return params

	}
	
	genUpdateParamsSql (name, data) {

		const {model} = this; if (!model) throw Error ('Model not set')

		const {map} = model; if (!map.has (name)) throw Error ('Entity not defined: ' + name)
		
		const {pk, columns, qName} = map.get (name)

		const sql = ['', ''], params = []
		
		for (const [k, v] of Object.entries (data)) {

			if (v === undefined) continue

			if (!(k in columns)) continue

			const {qName, nullable} = columns [k]
			
			const i = pk.includes (k) ? 1 : 0

			if (sql [i].length !== 0) sql [i] += DELIM_UPDATE [i]

			sql [i] += qName + '='

			if (v === null && !nullable) {
			
				sql [i] += 'DEFAULT'
			
			}
			else {
			
				sql [i] += '?'

				if (i === 0) params.push (v)
			
			}

		}

		for (const k of pk) {

			const v = data [k]; if (v == null) throw Error (`The value of ${k} must be defined and not null`)
			
			params.push (v)

		}

		if (sql [0].length === 0) return null
				
		params.push (`UPDATE ${qName} SET ${sql [0]} WHERE ${sql [1]}`)
		
		return params

	} 

	toParamsSql (query) {
	
		const params = []

		let select = ''; for (const {sql, qName} of query.columns.values ()) {

			if (select.length !== 0) select += ','

			select += sql + ' AS ' + qName

		}
		
		let from = ''; for (const t of query.tables) {
		
			if (!t.isFirst) from += ' ' + t.join + ' JOIN '
		
			from += t.sql + ' AS ' + t.qName

			if (!t.isFirst) {
			
				from += ' ON ' + t.on
				
				for (const filter of t.filters) {
				
					from += ' AND '

					from = this.appendFilter (from, params, filter)

				}

			}

		}
		
		let order = ''; for (const {sql, desc} of query.order) {

			if (order.length !== 0) order += ','

			order += sql; if (desc) order += ' DESC'

		}
		
		let sql = 'SELECT ' + select + ' FROM ' + from
		
		const {filters} = query.tables [0]; if (filters.length !== 0) {
		
			let where = ''; for (const filter of filters) {
			
				if (where.length !== 0) where += ' AND '
			
				where = this.appendFilter (where, params, filter)
				
			}
			
			sql += ' WHERE ' + where
		
		}

		if (order.length !== 0) sql += ' ORDER BY ' + order
		
		params.push (sql)
		
		return params

	}
	
	appendFilter (sql, params, filter) {
	
		for (const p of filter.params) params.push (p)
		
		return sql + filter.sql
	
	}
	
	genCreateMockView ({qName, columns}) {

		return 'CREATE VIEW ' + qName + ' AS SELECT ' + Object.values (columns)

			.map (({qName, typeDim}) => `CAST (NULL AS ${typeDim}) AS ${qName}`)

	}

}

module.exports = DbLang