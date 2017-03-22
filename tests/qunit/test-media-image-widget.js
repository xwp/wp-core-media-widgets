/* jshint qunit: true */
/* eslint-env qunit */

(function() {
	'use strict';

	module( 'Image Media Widget' );

	test( 'image widget control', function() {
		var ImageWidgetControl;
		equal( typeof wp.mediaWidgets.controlConstructors.media_image, 'function', 'wp.mediaWidgets.controlConstructors.media_image is a function' );
		ImageWidgetControl = wp.mediaWidgets.controlConstructors.media_image;
		ok( ImageWidgetControl.prototype instanceof wp.mediaWidgets.MediaWidgetControl, 'wp.mediaWidgets.controlConstructors.media_image subclasses wp.mediaWidgets.MediaWidgetControl' );
	} );

} )();
