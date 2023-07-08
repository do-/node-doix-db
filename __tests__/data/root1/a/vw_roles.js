module.exports = {

    label: 'Roles',

    columns: {
        id       : 'int    // PK',
        name     : 'string // Internal Name',
        label    : 'string // Human Readable Label',
    },
    
    pk: 'id',

  /* CREATE */

	options: 'RECURSIVE',

  /* VIEW ${name} */

//  specification: '(id)',

  /* AS */

	sql: 'SELECT * FROM roles',

}