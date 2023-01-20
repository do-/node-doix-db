const {DbLang} = require ('..')

const lang = new DbLang ()

test ('quoteName', () => {

	expect (lang.quoteName ('users')).toBe ('"users"')

	expect (lang.quoteName ('"id"')).toBe ('"""id"""')

})