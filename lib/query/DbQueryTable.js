const DbQueryTableColumnComparison = require ('./DbQueryTableColumnComparison.js')
const DbQueryColumn = require ('./DbQueryColumn.js')

const JOIN_TYPES_ALOWED = ['LEFT', 'INNER', 'CROSS']

class DbQueryTable {

	constructor (query, sql, o = {}) {
		
		this.isFirst = query.tables.length === 0

		this.query = query
		
		this.lang = query.lang
		
		const relation = query.model.find (sql); if (relation) {

			this.relation = relation

			const {qName, columns} = relation

			this.sql = qName

			this.alias = o.as || sql
			
			const names = o.columns || Object.keys (columns)

			this.columns = names.map (name => this.toQueryColumn (columns [name]))

		}
		else {

			this.alias = o.as

			this.sql = sql

		}

		if (this.isFirst) {

			if ('join' in o) throw Error ('1st table in the query have nothing to be joined to')

		}
		else {

			this.join = o.join || 'LEFT'

			if (!JOIN_TYPES_ALOWED.includes (this.join)) throw Error (`${this.join} JOIN is not supported. Allowed types: ${JOIN_TYPES_ALOWED.join (', ')}`)

		}
		
		switch (this.join) {
		
			case 'LEFT':
			case 'INNER':
				this.on = o.on
				this.adjustJoinCondition ()
				break

			default:
				if ('on' in o) throw Error ('Only LEFT and INNER JOIN can have the ON clause')
		
		}
		
		this.filters = []
		this.unknownColumnComparisons = []
		
		if (o.filters) for (const [name, op, value] of o.filters) this.addColumnComparison (name, op, value)

		query.tables.push (this)

	}

	toQueryColumn (column) {

		const c = new DbQueryColumn (

			this.query,
			
			this.qName + '.' + column.qName, 
			
			this.isFirst ? column.name : this.alias + '.' + column.name

		)
		
		c.table = this
		
		return c

	}

	createColumnComparison (name, op, value) {

		if (value == null && !this.lang.isUnaryOperator (op)) return null

		if (!this.relation || name in this.relation.columns)  return new DbQueryTableColumnComparison (this, name, op, value)

		this.unknownColumnComparisons.push ([name, op, value])

		return null

	}

	addFilter (filter) {

		if (filter == null) return

		this.filters.push (filter)

	}

	addColumnComparison (name, op, value) {

		this.addFilter (this.createColumnComparison (name, op, value))

	}
	
	get qName () {
	
		return this.lang.quoteName (this.alias)
	
	}
	
	adjustJoinCondition () {

		const {on, relation} = this; if (!relation) return
		
		const pre = this.qName + '.' + relation.columns [relation.pk [0]].qName + '='

		if (typeof on === 'string') {

			if (on.indexOf ('=') >= 0) return

			const [tableAlias, colName] = on.split ('.')

			const referringQueryTable = this.query.tables.find (t => t.alias === tableAlias)

			const referringRelation = referringQueryTable.relation
			
			const referringColumn = referringRelation.columns [colName]

			this.on = pre + referringQueryTable.qName + '.' + referringColumn.qName

		}
		else {

			for (const referringQueryTable of this.query.tables) {

				const referringRelation = referringQueryTable.relation; if (!referringRelation) continue

				for (const referringColumn of Object.values (referringRelation.columns)) {
				
					const {reference} = referringColumn; if (!reference || reference.targetRelation !== relation) continue

					if (this.on) throw Error (`Ambiguous references to ${this.alias}, cannot infer the join condition`)

					this.on = pre + referringQueryTable.qName + '.' + referringColumn.qName

				}

			}

			if (!this.on) throw Error (`Cannot find a reference to ${this.alias}`)

		}

	}

}

module.exports = DbQueryTable