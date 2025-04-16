const stringEscape = require ('string-escape-map')

const DbTable = require ('./model/DbTable.js')
const DbView  = require ('./model/DbView.js')

const DbProcedure = require ('./model/DbProcedure.js')
const DbFunction  = require ('./model/DbFunction.js')

const DbType =                require ('./model/types/DbType.js')
const DbTypeArithmeticFixed = require ('./model/types/DbTypeArithmeticFixed.js')
const DbTypeArithmeticFloat = require ('./model/types/DbTypeArithmeticFloat.js')
const DbTypeArithmeticInt =   require ('./model/types/DbTypeArithmeticInt.js')
const DbTypeCharacter =       require ('./model/types/DbTypeCharacter.js')
const DbTypeDate =            require ('./model/types/DbTypeDate.js')
const DbTypeTimestamp =       require ('./model/types/DbTypeTimestamp.js')

const CH_ROUND_CLOSE = ')'.charCodeAt (0)
const CH_CURLY_CLOSE = '}'.charCodeAt (0)
const CH_SLASH = '/'.charCodeAt (0)
const CH_BACK_SLASH = '\\'.charCodeAt (0)
const CH_QUESTION = '?'.charCodeAt (0)
const CH_EXCLAMATION = '!'.charCodeAt (0)

const RE_INT = /^[1-9][0-9]*$/

const CH_Q = "'", CH_QQ = '"'

const Q_ESC = new stringEscape ([
  [CH_Q,  CH_Q + CH_Q],
])

const QQ_ESC = new stringEscape ([
  [CH_QQ, CH_QQ + CH_QQ],
])

const DELIM_UPDATE = [',', ' AND ']

class DbLang {

	static TP_SMALLINT  = new DbTypeArithmeticInt   ({name: 'SMALLINT', bytes: 2})
	static TP_INT       = new DbTypeArithmeticInt   ({name: 'INT',      bytes: 4})
	static TP_BIGINT    = new DbTypeArithmeticInt   ({name: 'BIGINT',   bytes: 8})
	static TP_REAL      = new DbTypeArithmeticFloat ({name: 'REAL'})
	static TP_NUMERIC   = new DbTypeArithmeticFixed ({name: 'NUMERIC'})
	static TP_CHAR      = new DbTypeCharacter       ({name: 'CHAR'})
	static TP_VARCHAR   = new DbTypeCharacter       ({name: 'VARCHAR'})
	static TP_DATE      = new DbTypeDate            ({name: 'DATE'})
	static TP_TIMESTAMP = new DbTypeTimestamp       ({name: 'TIMESTAMP'})

	getTypeDefinition (name) {

		name = name.toUpperCase ()

		switch (name) {

			case 'INT':
			case 'INTEGER':
				return DbLang.TP_INT

			case 'BIGINT':
				return DbLang.TP_BIGINT

			case 'SMALLINT':
				return DbLang.TP_SMALLINT

			case 'CHAR':
				return DbLang.TP_CHAR

			case 'VARCHAR':
				return DbLang.TP_VARCHAR

			case 'NUMERIC':
			case 'DECIMAL':
				return DbLang.TP_NUMERIC

			case 'REAL':
				return DbLang.TP_REAL

			case 'DATE':
				return DbLang.TP_DATE
			
			case 'TIMESTAMP':
				return DbLang.TP_TIMESTAMP

		}

		return new DbType ({name})

	}

	getDbObjectClass (o) {
	
		if (o == null) throw Error ('Empty definition')

		if (typeof o !== 'object' || Array.isArray (o)) throw Error ('Not an object')

		if ('columns' in o) return 'sql' in o ? DbView : DbTable

		if ('body'    in o) return 'returns' in o ? DbFunction : DbProcedure

		throw Error ('Cannot detect type for ' + JSON.stringify (o))
	
	}

	createDbObject (options) {

		{

			const {columns} = options; if (columns) 

				for (const name in columns)

					if (typeof columns [name] === 'string')
						
						columns [name] = this.parseColumn (columns [name])

		}

		const clazz = this.getDbObjectClass (options)

		const dbObject = new clazz (options)

		dbObject.setLang (this)

		return dbObject

	}

	getDbObjectClassesToDiscover () {
	
		return [DbTable]
	
	}

	isEqualColumnDefault (column, existing) {

		return column.default == existing.default

	}

	isAdequateColumnType (typeAsIs, typeToBe) {

		if (typeToBe instanceof DbTypeArithmeticInt && typeAsIs instanceof DbTypeArithmeticInt) return (
			typeAsIs.isSigned === typeToBe.isSigned &&
			typeAsIs.bytes     >= typeToBe.bytes
		)

		return typeAsIs.name === typeToBe.name

	}

	isAdequateColumnTypeDim (asIs, toBe) {

		const typeToBe = this.getTypeDefinition (toBe.type), typeAsIs = this.getTypeDefinition (asIs.type)

		if (typeToBe !== typeAsIs && !this.isAdequateColumnType (typeAsIs, typeToBe)) return false

		if (toBe.size > 0 && toBe.size > asIs.size) return false

		if (typeToBe instanceof DbTypeArithmeticFixed && toBe.scale > asIs.scale) return false
		
		return true

	}
	
	compareColumns (asIs, toBe) {
	
		const diff = []

		if (asIs.nullable !== toBe.nullable) diff.push ('nullable')

		if (!this.isEqualColumnDefault (asIs, toBe)) diff.push ('default')

		if (!this.isAdequateColumnTypeDim (asIs, toBe)) diff.push ('typeDim')

		return diff

	}

	getRequiredMutation (asIs, toBe) {
	
		return null
	
	}

	getRequiredColumnMutation (asIs, toBe) {

		return asIs.diff.length === 0 ? null : 'alter-column'
	
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

	getDbObjectName (o) {

		const {schemaName, localName} = o

		if (schemaName === null) return this.quoteName (localName)

		return this.quoteName (o.schemaName) + '.' + this.quoteName (localName)

	}
		
	getDbColumnTypeDim (col) {

		const {type, size} = col; if (size == null) return type

		let s = `${type}(${size}`

		const {scale} = col; if (scale != null) {
			s += ','
			s += scale
		}
		
		s += ')'

		return s

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
				throw Error ('Unknown comparison operator: ' + filter.op)

		}
	
	}

	genInsertParamsSql (name, data) {

		const {model} = this; if (!model) throw Error ('Model not set')

		const table = model.find (name); if (!table) throw Error ('Entity not defined: ' + name)

		const {columns, qName} = table

		let sql = '', params = []
		
		for (const [k, v] of Object.entries (data)) {

			if (v === undefined) continue

			if (!(k in columns)) continue

			const {qName} = columns [k]
			
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

		const table = model.find (name); if (!table) throw Error ('Entity not defined: ' + name)
		
		const {pk, columns, qName} = table

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
		
	* genDDL () {
	
	}

	* genColumnConstraints (column) {

		if (column.nullable === false) yield 'NOT NULL'

	}

	genColumnDataType (column) {

		return column.typeDim

	}

	* genColumnDefinitionParts (column) {

		yield column.qName

		yield this.genColumnDataType (column)

		{

			const def = column.default

			if (def) yield 'DEFAULT ' + def

		}

		for (const c of this.genColumnConstraints (column)) yield c

	}

	genColumnDefinition (column) {

		return [...this.genColumnDefinitionParts (column)].join (' ')

	}
	
	genCreateTempTable ({qName, columns}, options = {}) {

		let sql = 'CREATE TEMPORARY TABLE '

		if (options.onlyIfMissing) sql += 'IF NOT EXISTS '

		return sql + qName + ' (' + Object.values (columns).map (c => this.genColumnDefinition (c)) + ')'

	}

	getTriggerName (table, i) {

		return table.name + '__trg_' + i.toString ().padStart ((table.triggers.length - 1).toString ().length, '0')
	
	}

	getIndexName (relation, index) {

		return relation.name + '_' + index.name
	
	}

	wrapViewSql (view) {

		view.sql = `SELECT ${Object.values (view.columns).map (i => i.qName)} FROM (${view.sql}) t`

	}

	normalizeSQL (call) {

		call.sql = call.sql.trim ()

		const {sql} = call, {length} = sql; if (length === 0) return
	
		let r = '', from = 0

		while (from < length) {

			let to = from + 1; while (to < length && sql.charCodeAt (to) > 32) to ++

			if (r.length !== 0) r += ' '

			r += sql.slice (from, to)

			from = to; while (from < length && sql.charCodeAt (from) <= 32) from ++
	
		}
	
		call.sql = r

	}

	genPeekSql ({qName, queue: {order}}) {

		return `SELECT * FROM ${qName} ORDER BY ${order}`

	}

	parseColumn (src) {

		const o = {src: src.trim ()}

		try {

			this.parseColumnComment (o) 
			this.parseColumnPattern (o)
			this.parseColumnRange (o)
			this.parseColumnDefault (o)
	
			if (o.src.length === 0) throw Error (`Cannot determine the type`)
	
			this.parseColumnNullable (o)
	
			o.isReference = o.type.startsWith ('(')
			
			if (!o.isReference) {
				this.parseColumnDimension (o)
			}
	
			o.src = src
	
			return o
	
		}
		catch (cause) {

			if (o.src.length === 0) throw Error (`Invalid column definition: '${src}'`, {cause})

		}
	
	}

	parseColumnComment (o) {

		const {src} = o, pos = src.lastIndexOf ('//'); if (pos < 0) return
			
		o.comment = src.substring (pos + 2).trimStart ()

		o.src = src.substring (0, pos).trimEnd ()

	}

	parseColumnPattern (o) {

		const {src} = o

		let pos = src.length - 1; if (src.charCodeAt (pos) !== CH_SLASH) return

		while (true) {

			pos = src.lastIndexOf ('/', pos - 1); if (pos < 0) throw Error (`Cannot find opening '/' for the pattern`)

			if (src.charCodeAt (pos - 1) !== CH_BACK_SLASH) break
			
		}
		
		o.pattern = src.slice (pos + 1, -1)
		
		o.src = src.substring (0, pos).trimEnd ()

	}

	parseColumnRange (o) {

		const {src} = o

		if (src.charCodeAt (src.length - 1) !== CH_CURLY_CLOSE) return

		const begin = src.lastIndexOf ('{'); if (begin < 0) throw Error (`Cannot find the opening '{' for range`)

		const range = src.slice (begin + 1, -1)

		o.src = src.substring (0, begin).trimEnd ()

		const pos = range.indexOf ('..'); if (pos < 0) throw Error (`Cannot find '..' between '{' and '}'`)
		
		const min = range.substring (0, pos).trim (); if (min.length !== 0) o.min = min

		const max = range.substring (pos + 2).trim (); if (max.length !== 0) o.max = max

	}

	parseColumnDefault (o) {

		const {src} = o, pos = src.indexOf ('='); if (pos < 0) return
		
		o.default = src.substring (pos + 1).trimStart ()

		if (o.default.length === 0) throw Error (`Empty (but not NULL neither '') default definition`)

		o.src = src.substring (0, pos).trimEnd ()

	}
		
	parseColumnNullable (o) {

		let nullable = !('default' in o)

		const {src} = o, {length} = src, override = nullable ? CH_EXCLAMATION : CH_QUESTION

		if (src.charCodeAt (length - 1) === override) {
		
			nullable = !nullable
			
			o.src = src.slice (0, -1).trim ()

		}

		o.nullable = nullable

		o.type = o.src

	}
	
	parseColumnDimension (o) {

		const src = o.type

		if (src.charCodeAt (src.length - 1) !== CH_ROUND_CLOSE) return

		const begin = src.lastIndexOf ('('); if (begin < 0) throw Error (`Cannot find opening '(' for dimension`)

		let dimension = src.slice (begin + 1, -1)

		o.type = src.slice (0, begin).trim ()

		const pos = dimension.indexOf (','); if (pos >= 0) {
		
			const scale = dimension.slice (pos + 1).trim ()

			if (!RE_INT.test (scale)) throw Error (`Not a positive integer as scale`)
		
			o.scale = parseInt (scale)
			
			dimension = dimension.slice (0, pos).trim ()
		
		}

		if (!RE_INT.test (dimension)) throw Error (`Not a positive integer as column dimension`)

		o.size = parseInt (dimension)

	}

}

module.exports = DbLang