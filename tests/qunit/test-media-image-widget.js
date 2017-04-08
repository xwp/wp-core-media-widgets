/* jshint qunit: true */
/* eslint-env qunit */

( function() {
	'use strict';

	var imageAttachmentAttributes;

	module( 'Image Media Widget' );

	imageAttachmentAttributes = {
		alt: '',
		author: '1',
		authorName: 'admin',
		caption: '',
		height: 1080,
		id: 777,
		link: 'http://example.com/?attachment_id=777',
		mime: 'image/jpeg',
		name: 'Chicken and Ribs',
		orientation: 'landscape',
		sizes: {
			medium: {
				url: 'http://example.com/wp-content/uploads/2017/04/chicken-and-ribs-300x300.jpg'
			}
		},
		title: 'Chicken and Ribs',
		type: 'image',
		url: 'http://example.com/wp-content/uploads/2017/04/chicken-and-ribs.jpg',
		width: 1080
	};

	test( 'image widget control', function() {
		var ImageWidgetControl, imageWidgetControlInstance, imageWidgetModelInstance;
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
		imageWidgetControlInstance.selectedAttachment.set( imageAttachmentAttributes );
		imageWidgetControlInstance.renderPreview();
		equal( imageWidgetControlInstance.$el.find( 'img' ).attr( 'src' ), 'http://example.com/wp-content/uploads/2017/04/chicken-and-ribs-300x300.jpg', 'renderPreview should set proper img src' );
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
