/* jshint qunit: true */
/* eslint-env qunit */

( function( $ ) {
	'use strict';

	module( 'Image Media Widget' );

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
		imageWidgetControlInstance.selectedAttachment.set( window._wpMediaImageWidget.attachment );
		imageWidgetControlInstance.renderPreview();
		equal( imageWidgetControlInstance.$el.find( 'img' ).attr( 'src' ), 'http://src.wordpress-develop.dev/wp-content/uploads/2017/04/chicken-and-ribs-300x300.jpg', 'renderPreview should set proper img src' );

		// Test editMedia
		imageWidgetControlInstance.editMedia();
		$( '.image-details textarea' ).val( 'amazing caption' ).trigger( 'change' );
		$( '.setting.alt-text input' ).val( 'alt text all the things' ).trigger( 'change' );
		$( '.setting.align button' ).first().trigger( 'click' );
		$( '.setting.link-to select' ).val( 'none' );
		$( '.setting.title-text input' ).val( 'title text' ).trigger( 'change' );
		$( '.setting.extra-classes input' ).val( 'super-awesome-class' ).trigger( 'change' );
		$( '.setting.link-target input' ).trigger( 'click' );
		$( '.setting.link-rel input' ).val( 'rel text' ).trigger( 'change' );
		$( '.setting.link-class-name input' ).val( 'classy-link' ).trigger( 'change' );

		setTimeout( function() {
			$( '.media-toolbar-primary .button-primary' ).trigger( 'click' );
		} );
		asyncTest( 'Media Modal Edits', function() {
			expect( 8 ); // eslint-disable-line no-magic-numbers
			setTimeout( function() { // eslint-disable-line max-nested-callbacks
				equal( imageWidgetControlInstance.model.get( 'caption' ), 'amazing caption', 'caption edit should update the model' );
				equal( imageWidgetControlInstance.model.get( 'alt' ), 'alt text all the things', 'alt text edit should update the model' );
				equal( imageWidgetControlInstance.model.get( 'align' ), 'left', 'align edit should update the model' );
				equal( imageWidgetControlInstance.model.get( 'link_type' ), 'none', 'link-to edit should update the model' );
				equal( imageWidgetControlInstance.model.get( 'image_title' ), 'title text', 'title text edit should update the model' );
				equal( imageWidgetControlInstance.model.get( 'image_classes' ), 'super-awesome-class', 'image classes edit should update the model' );
				equal( imageWidgetControlInstance.model.get( 'link_rel' ), 'rel text', 'rel text edit should update the model' );
				equal( imageWidgetControlInstance.model.get( 'link_classes' ), 'classy-link', 'link classes edit should update the model' );
				start();
			} );
		} );
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

} )( jQuery );
