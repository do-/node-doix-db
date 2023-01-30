const DbRelation = require ('../model/DbRelation.js')
const DbQueryColumn = require ('./DbQueryColumn.js')
const DbQueryTableColumnComparison = require ('./DbQueryTableColumnComparison.js')

const JOIN_TYPES_ALOWED = ['LEFT', 'INNER', 'CROSS']

class DbQueryTable {

	constructor (query, expr, o = {}) {

		const {model, lang} = query, {map} = model
		
		this.isFirst = query.tables.length === 0

		this.query = query
		
		this.lang = lang
		
		if (map.has (expr)) {

			this.relation = map.get (expr)
			
			this.expr = this.relation.qName

			this.alias = o.as || expr

			const {columns} = this.relation
			
			const names = o.columns || Object.keys (columns)

			this.columns = names.map (name => columns [name].toQueryColumn (this))

		}
		else {

			this.alias = o.as

			this.expr = expr

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
		
		if (o.filters) for (const [name, op, value] of o.filters)

			this.addColumnComparison (name, op, value)

		query.tables.push (this)

	}
	
	get qName () {
	
		return this.lang.quoteName (this.alias)
	
	}

	addColumnComparison (name, op, value) {
		
		if (value == null && !this.lang.isUnaryOperator (op)) return

		new DbQueryTableColumnComparison (this, name, op, value)

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