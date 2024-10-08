const DbQueryBinary = require ('./lib/query/DbQueryBinary.js')

module.exports = {

	DbClient:       require ('./lib/DbClient.js'),
	DbPool:         require ('./lib/DbPool.js'), 
	DbLang:         require ('./lib/DbLang.js'),
	DbCsvPrinter:   require ('./lib/DbCsvPrinter.js'),
	DbQueue:        require ('./lib/DbQueue.js'),

	DbColumn:       require ('./lib/model/DbColumn.js'),
	DbReference:    require ('./lib/model/DbReference.js'),
	DbObjectMerger: require ('./lib/model/DbObjectMerger.js'),
	DbRelation:     require ('./lib/model/DbRelation.js'),	
	DbTable:        require ('./lib/model/DbTable.js'),
	DbView:         require ('./lib/model/DbView.js'),
	DbSchemaSource: require ('./lib/model/DbSchemaSource.js'),
	DbObject:       require ('./lib/model/DbObject.js'),
	DbProcedure:    require ('./lib/model/DbProcedure.js'),
	DbRoutine:      require ('./lib/model/DbRoutine.js'),
	DbFunction:     require ('./lib/model/DbFunction.js'),
	DbModel:        require ('./lib/model/DbModel.js'),
	DbSchema:       require ('./lib/model/DbSchema.js'),

	DbType:                require ('./lib/model/types/DbType.js'),
	DbTypeArithmetic:      require ('./lib/model/types/DbTypeArithmetic.js'),
	DbTypeArithmeticFixed: require ('./lib/model/types/DbTypeArithmeticFixed.js'),
	DbTypeArithmeticFloat: require ('./lib/model/types/DbTypeArithmeticFloat.js'),
	DbTypeArithmeticInt:   require ('./lib/model/types/DbTypeArithmeticInt.js'),
	DbTypeCharacter:       require ('./lib/model/types/DbTypeCharacter.js'),
	DbTypeDate:            require ('./lib/model/types/DbTypeDate.js'),
	DbTypeTimestamp:       require ('./lib/model/types/DbTypeTimestamp.js'),

	DbMigrationPlan:require ('./lib/migration/DbMigrationPlan.js'),
	DbQuery:        require ('./lib/query/DbQuery.js'),
	DbQueryTable:   require ('./lib/query/DbQueryTable.js'),
	DbQueryColumn:  require ('./lib/query/DbQueryColumn.js'),	
	DbQueryNot:     require ('./lib/query/DbQueryNot.js'),
	DbQueryOr:      DbQueryBinary ('OR'),
	DbQueryAnd:     DbQueryBinary ('AND'),

	DbQueryTableColumnComparison: require ('./lib/query/DbQueryTableColumnComparison.js'),

}