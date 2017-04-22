/* global require */

var grunt = require( 'grunt' );

grunt.initConfig({
	qunit: {
		all: [ 'tests/qunit/**/*.html' ]
	}
});

grunt.loadNpmTasks( 'grunt-contrib-qunit' );
