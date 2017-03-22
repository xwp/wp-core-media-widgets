/* jshint qunit: true */
/* eslint-env qunit */

(function() {
	'use strict';

	module( 'Media Widgets' );

	test( 'namespace', function() {
		equal( typeof wp.mediaWidgets, 'object', 'wp.mediaWidgets is an object' );
		equal( typeof wp.mediaWidgets.controlConstructors, 'object', 'wp.mediaWidgets.controlConstructors is an object' );
		equal( typeof wp.mediaWidgets.modelConstructors, 'object', 'wp.mediaWidgets.modelConstructors is an object' );
		equal( typeof wp.mediaWidgets.widgetControls, 'object', 'wp.mediaWidgets.widgetControls is an object' );
		equal( typeof wp.mediaWidgets.handleWidgetAdded, 'function', 'wp.mediaWidgets.handleWidgetAdded is an function' );
		equal( typeof wp.mediaWidgets.handleWidgetUpdated, 'function', 'wp.mediaWidgets.handleWidgetUpdated is an function' );
		equal( typeof wp.mediaWidgets.init, 'function', 'wp.mediaWidgets.init is an function' );
	} );

	test( 'media widget control', function() {
		equal( typeof wp.mediaWidgets.MediaWidgetControl, 'function', 'wp.mediaWidgets.MediaWidgetControl' );
		ok( wp.mediaWidgets.MediaWidgetControl.prototype instanceof Backbone.View, 'wp.mediaWidgets.MediaWidgetControl subclasses Backbone.View' );
	} );

	test( 'media widget model', function() {
		equal( typeof wp.mediaWidgets.MediaWidgetModel, 'function', 'wp.mediaWidgets.MediaWidgetModel is a function' );
		ok( wp.mediaWidgets.MediaWidgetModel.prototype instanceof Backbone.Model, 'wp.mediaWidgets.MediaWidgetModel subclasses Backbone.Model' );
	} );

})();
