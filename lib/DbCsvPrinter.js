const DbColumn = require ('./model/DbColumn.js')
const DbTypeArithmetic =      require ('./model/types/DbTypeArithmetic.js')
const DbTypeArithmeticInt =   require ('./model/types/DbTypeArithmeticInt.js')
const DbTypeArithmeticFixed = require ('./model/types/DbTypeArithmeticFixed.js')
const DbTypeArithmeticFloat = require ('./model/types/DbTypeArithmeticFloat.js')
const DbTypeCharacter =       require ('./model/types/DbTypeCharacter.js')
const DbTypeTemporal =        require ('./model/types/DbTypeTemporal.js')
const DbTypeDate =            require ('./model/types/DbTypeDate.js')
const DbTypeTimestamp =       require ('./model/types/DbTypeTimestamp.js')
const {Transform} = require ('stream')
const stringEscape = require ('string-escape-map')
const CH_QQ = '"', QQ_ESC = new stringEscape ([[CH_QQ, CH_QQ + CH_QQ]])

const FMT_ISO_DATE = new Intl.DateTimeFormat ('sv', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
})

const FMT_ISO_TIMESTAMP = new Intl.DateTimeFormat ('sv', {
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	fractionalSecondDigits: 3
})

const DEFAULT = {
	NULL:  '',
	NaN:   'NaN',
	TRUE:  '1',
	FALSE: '0',
}

class DbCsvPrinter extends Transform {

	constructor (options = {}) {

		let {table, columns, lang} = options

		super ({writableObjectMode: true})

		for (const k in DEFAULT) this [k] = options [k] ?? DEFAULT [k]

		if (!columns) {
			if (!table) throw Error (`Either table or columns must be defined`)
			columns = Object.values (table.columns)
		}		

		if (lang) {

			this.lang = lang

		} 
		else {

			if (table) {
				this.lang = table.model.lang
			}
			else {
				throw Error (`Lang not defined`)
			}

		}

		if (!Array.isArray (columns)) columns = Object.entries (columns).map (([name, def]) => {

			if (typeof def === 'string') def = this.lang.parseColumn (def)

			const col = new DbColumn (def)

			col.name = name

			return col

		})

		const {length} = columns; for (let i = 0; i < length; i ++) {

			const col = columns [i];
				
			if (typeof col === 'string') {

				if (!table) throw Error ('To pass columns by name only, the table must be provided')

				if (!(col in table.columns)) throw Error (`${table.name}.${col} not found`)
	
				columns [i] = table.columns [col]

			}

			if (!('typeDef' in columns [i])) columns [i].setLang (this.lang)
		
		}

		this.columns = columns

	}

	_transform (r, _, callback) {

		const {columns} = this, {length} = columns

		try {

			let s = ''; for (let i = 0; i < length; i ++) {

				if (i !== 0) s += ','

				const column = columns [i], {name, typeDef} = column

				const value = r [name], v = value == null ? column.default : value

				if (Number.isNaN (v)) { // `Number.NaN` doesn't work as a `switch` `case`

					if (!(typeDef instanceof DbTypeArithmeticFloat)) throw Error (`NaN values are only supported for floating point numeric types, but ${column.name} is defined as ${column.type}`)

					s += this.NaN

					continue

				}

				if (v == null) { // here, `undefined` fits too

					if (!column.nullable) throw Error (`${name} doesn't allow null values`)

					s += this.NULL

					continue

				}

				switch (v) {

					case true:
						s += this.TRUE
						continue

					case false:
						s += this.FALSE
						continue

					case Number.POSITIVE_INFINITY:
					case Number.NEGATIVE_INFINITY:
						throw Error (`${column.name}: infinite values not supported`)

				}

				if (typeDef instanceof DbTypeCharacter) {

					s += CH_QQ
					s += QQ_ESC.escape (String (v))
					s += CH_QQ

				}
				else if (typeDef instanceof DbTypeArithmetic) {

					const n = Number (v); if (Number.isNaN (n)) throw Error (`${column.name} must be a number, found a ${typeof value} '${value}'`)

					if (typeDef instanceof DbTypeArithmeticInt && !Number.isInteger (Number (v))) throw Error (`${column.name} must be integer, found ${value}`)

					s += typeDef instanceof DbTypeArithmeticFixed ? n.toFixed (column.scale) : n

				}
				else if (typeDef instanceof DbTypeTemporal) {

					const isDate = typeDef instanceof DbTypeDate; if (!isDate && !(typeDef instanceof DbTypeTimestamp)) throw Error (`Don't know how to format ${column.name}`)

					let d; if (typeof v === 'string') {

						d = v

					}
					else if (v instanceof Date) {

						d = (isDate ? FMT_ISO_DATE : FMT_ISO_TIMESTAMP).format (v)

					}
					else {

						throw Error (`${column.name} must be a date/time, found ${value}`)

					}

					if (isDate) {

						const {length} = d

						if (length < 10) {
							throw Error (`${column.name} must be a date, found ${value}`)
						}
						else if (length === 10) {
							s += d
						}
						else {
							s += d.slice (0, 10)
						}

					}
					else {

						const {length} = d, {scale} = column

						if (length < 19) {

							throw Error (`${column.name} must be a timestamp, found ${value}`)

						}
						else {

							s += d.slice (0, 19)

							if (scale > 0 && length > 20) {

								s += '.'
								s += d.slice (20, 20 + scale)

							}
							
						}

					}

				}
				else {

					throw Error (`Don't know how to format ${column.name}`)

				}

			}

			s += '\n'; callback (null, s)

		}
		catch (err) {

			callback (err)

		}

	}

}

module.exports = DbCsvPrinter