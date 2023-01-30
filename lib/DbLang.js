const stringEscape = require ('string-escape-map')

const DbTable = require ('./model/DbTable.js')
const DbView  = require ('./model/DbView.js')

const QQ_ESC = new stringEscape ([
  [ '"', '""'],
])

class DbLang {

	getDbObjectClass (o) {
	
		if (o == null) throw Error ('Empty definition')

		if (typeof o !== 'object' || Array.isArray (o)) throw Error ('Not an object')

		if (!('columns' in o)) throw Error ('Cannot detect type for ' + JSON.stringify (o))
		
		return 'sql' in o ? DbView : DbTable
	
	}

	quoteName (s) {

		return '"' + QQ_ESC.escape (s) + '"'

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

	toParamsSql (query) {
	
		const params = []

		let select = ''; for (const {expr, qName} of query.columns.values ()) {

			if (select.length !== 0) select += ','

			select += expr + ' AS ' + qName

		}
		
		let from = ''; for (const t of query.tables) {
		
			if (!t.isFirst) from += ' ' + t.join + ' JOIN '
		
			from += t.expr + ' AS ' + t.qName

			if (!t.isFirst) {
			
				from += ' ON ' + t.on
				
				for (const filter of t.filters) {
				
					from += ' AND '

					from = filter.appendTo (from, params)

				}

			}

		}
		
		let order = ''; for (const {expr, desc} of query.order) {

			if (order.length !== 0) order += ','

			order += expr; if (desc) order += ' DESC'

		}
		
		let sql = 'SELECT ' + select + ' FROM ' + from
		
		const {filters} = query.tables [0]; if (filters.length !== 0) {
		
			let where = ''; for (const filter of filters) {
			
				if (where.length !== 0) where += ' AND '
			
				where = filter.appendTo (where, params)
				
			}
			
			sql += ' WHERE ' + where
		
		}

		if (order.length !== 0) sql += ' ORDER BY ' + order
		
		params.push (sql)
		
		return params

	}
	
	genCreateMockView ({qName, columns}) {

		return 'CREATE VIEW ' + qName + ' AS SELECT ' + Object.values (columns)

			.map (({qName, typeDim}) => `CAST (NULL AS ${typeDim}) AS ${qName}`)

	}

}

module.exports = DbLang