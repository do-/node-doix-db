const {DbObject} = require ('..')

test ('bad', () => {

	expect (() => new DbObject ({})).toThrow ()
	expect (() => new DbObject ({name: ''})).toThrow ()
	expect (() => new DbObject ({name: 1})).toThrow ()

})
