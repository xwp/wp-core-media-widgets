/* jshint qunit: true */
/* eslint-env qunit */
/* eslint-disable no-magic-numbers */

( function() {
	'use strict';

	var data = {};

	module( 'Image Media Widget' );

	data.imageAttachment = {
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
				url: 'http://s.w.org/style/images/wp-header-logo200x200.png'
			}
		},
		title: 'Chicken and Ribs',
		type: 'image',
		url: 'http://s.w.org/style/images/wp-header-logo.png',
		width: 1080
	};

	asyncTest( 'image widget control', function() {
		var ImageWidgetControl, imageWidgetControlInstance, imageWidgetModelInstance, propsData;

		expect( 10 );

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

		// Test getSelectedFrameProps() and _getAttachmentProps() with selection
		imageWidgetControlInstance.selectMedia();
		setTimeout( function() {
			wp.media.frame.state().get( 'selection' ).first().set( _.extend( data.imageAttachment, {
				caption: 'a witty caption',
				alt: 'some alt text too'
			} ) );
			propsData = imageWidgetControlInstance.getSelectFrameProps( wp.media.frame );
			equal( propsData.alt, 'some alt text too', 'getSelectedFrameProps should set alt properly' );
			equal( propsData.attachment_id, data.imageAttachment.id, 'getSelectedFrameProps should set attachment_id properly' );
			equal( propsData.caption, 'a witty caption', 'getSelectedFrameProps should set caption properly' );
			equal( propsData.url, data.imageAttachment.sizes.medium.url, 'getSelectedFrameProps should set url properly' );
		} );
		setTimeout( function() {
			wp.media.frame.close();
		} );
		setTimeout( start, 100 );
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
