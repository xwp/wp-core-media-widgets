/* jshint qunit: true */
/* eslint-env qunit */
/* eslint-disable no-magic-numbers */

( function() {
	'use strict';

	module( 'Image Media Widget' );

	asyncTest( 'image widget control', function() {
		var ImageWidgetControl, imageWidgetControlInstance, imageWidgetModelInstance;

		expect( 6 );

		equal( typeof wp.mediaWidgets.controlConstructors.media_image, 'function', 'wp.mediaWidgets.controlConstructors.media_image is a function' );
		ImageWidgetControl = wp.mediaWidgets.controlConstructors.media_image;
		ok( ImageWidgetControl.prototype instanceof wp.mediaWidgets.MediaWidgetControl, 'wp.mediaWidgets.controlConstructors.media_image subclasses wp.mediaWidgets.MediaWidgetControl' );

		imageWidgetModelInstance = new wp.mediaWidgets.modelConstructors.media_image();
		imageWidgetControlInstance = new ImageWidgetControl( {
			model: imageWidgetModelInstance
		} );
		equal( imageWidgetControlInstance.isSelected(), false, 'media_image.isSelected() should return false when no media is selected' );

		// Test editing of Widget Title
		imageWidgetControlInstance.render();
		imageWidgetControlInstance.$el.find( '.title' ).val( 'Chicken and Ribs' ).trigger( 'input' );
		equal( imageWidgetModelInstance.get( 'title' ), 'Chicken and Ribs', 'Changing title should update model title attribute' );

		// Test Preview
		equal( imageWidgetControlInstance.$el.find( 'img' ).length, 0, 'No images should be rendered' );
		imageWidgetModelInstance.set( 'url', 'http://s.w.org/style/images/wp-header-logo.png' );

		// Due to renderPreview being deferred.
		setTimeout( function() {
			equal( imageWidgetControlInstance.$el.find( 'img[src="http://s.w.org/style/images/wp-header-logo.png"]' ).length, 1, 'One image should be rendered' );
		}, 50 );
		setTimeout( start, 1000 );
	} );

	test( 'image media model', function() {
		var ImageWidgetModel, imageWidgetModelInstance;
		equal( typeof wp.mediaWidgets.modelConstructors.media_image, 'function', 'wp.mediaWidgets.modelConstructors.media_image is a function' );
		ImageWidgetModel = wp.mediaWidgets.modelConstructors.media_image;
		ok( ImageWidgetModel.prototype instanceof wp.mediaWidgets.MediaWidgetModel, 'wp.mediaWidgets.modelConstructors.media_image subclasses wp.mediaWidgets.MediaWidgetModel' );

		imageWidgetModelInstance = new ImageWidgetModel();
		_.each( imageWidgetModelInstance.attributes, function( value, key ) {
			equal( value, ImageWidgetModel.prototype.schema[ key ][ 'default' ], 'Should properly set default for ' + key );
		} );
	} );

} )();
