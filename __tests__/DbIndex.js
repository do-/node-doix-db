const DbIndex = require ('../lib/model/DbIndex.js')

test ('bad', () => {

	expect (() => new DbIndex (0)).toThrow ()

})