/* jshint qunit: true */
/* eslint-env qunit */
/* eslint-disable no-magic-numbers */

( function() {
	'use strict';

	module( 'Image Media Widget' );

	asyncTest( 'image widget control', function() {
		var ImageWidgetControl, imageWidgetControlInstance, imageWidgetModelInstance, mappedProps;

		expect( 12 );

		equal( typeof wp.mediaWidgets.controlConstructors.media_image, 'function', 'wp.mediaWidgets.controlConstructors.media_image is a function' );
		ImageWidgetControl = wp.mediaWidgets.controlConstructors.media_image;
		ok( ImageWidgetControl.prototype instanceof wp.mediaWidgets.MediaWidgetControl, 'wp.mediaWidgets.controlConstructors.media_image subclasses wp.mediaWidgets.MediaWidgetControl' );

		imageWidgetModelInstance = new wp.mediaWidgets.modelConstructors.media_image();
		imageWidgetControlInstance = new ImageWidgetControl({
			model: imageWidgetModelInstance
		});

		// Test isSelected()
		equal( imageWidgetControlInstance.isSelected(), false, 'media_image.isSelected() should return false when no media is selected' );
		imageWidgetControlInstance.model.set({ error: 'missing_attachment', attachment_id: 777 });
		equal( imageWidgetControlInstance.isSelected(), false, 'media_image.isSelected() should return false when media is selected and error is set' );
		imageWidgetControlInstance.model.set({ error: false, attachment_id: 777 });
		equal( imageWidgetControlInstance.isSelected(), true, 'media_image.isSelected() should return true when media is selected and no error exists' );
		imageWidgetControlInstance.model.set({ error: false, attachment_id: 0, url: 'http://s.w.org/style/images/wp-header-logo.png' });
		equal( imageWidgetControlInstance.isSelected(), true, 'media_image.isSelected() should return true when url is set and no error exists' );

		// Reset model
		imageWidgetControlInstance.model.set({ error: false, attachment_id: 0, url: null });

		// Test editing of Widget Title
		imageWidgetControlInstance.render();
		imageWidgetControlInstance.$el.find( '.title' ).val( 'Chicken and Ribs' ).trigger( 'input' );
		equal( imageWidgetModelInstance.get( 'title' ), 'Chicken and Ribs', 'Changing title should update model title attribute' );

		// Test mapModelToMediaFrameProps();
		imageWidgetControlInstance.model.set({ error: false, id: 777, url: 'http://s.w.org/style/images/wp-header-logo.png', 'link_type': 'custom', 'link_url': 'https://wordpress.org', 'size': 'custom', 'width': 100, 'height': 150 });
		mappedProps = imageWidgetControlInstance.mapModelToMediaFrameProps( imageWidgetControlInstance.model.toJSON() );
		equal( mappedProps.linkUrl, 'https://wordpress.org', 'mapModelToMediaFrameProps should set linkUrl from model.link_url' );
		equal( mappedProps.link, 'custom', 'mapModelToMediaFrameProps should set link from model.link_type' );
		equal( mappedProps.attachment_id, 777, 'mapModelToMediaFrameProps should set attachment_id from model.id' );
		equal( mappedProps.width, 100, 'mapModelToMediaFrameProps should set width when model.size is custom' );
		equal( mappedProps.height, 150, 'mapModelToMediaFrameProps should set height when model.size is custom' );

		start();
	});

	test( 'image media model', function() {
		var ImageWidgetModel, imageWidgetModelInstance;
		equal( typeof wp.mediaWidgets.modelConstructors.media_image, 'function', 'wp.mediaWidgets.modelConstructors.media_image is a function' );
		ImageWidgetModel = wp.mediaWidgets.modelConstructors.media_image;
		ok( ImageWidgetModel.prototype instanceof wp.mediaWidgets.MediaWidgetModel, 'wp.mediaWidgets.modelConstructors.media_image subclasses wp.mediaWidgets.MediaWidgetModel' );

		imageWidgetModelInstance = new ImageWidgetModel();
		_.each( imageWidgetModelInstance.attributes, function( value, key ) {
			equal( value, ImageWidgetModel.prototype.schema[ key ][ 'default' ], 'Should properly set default for ' + key );
		});
	});

})();
