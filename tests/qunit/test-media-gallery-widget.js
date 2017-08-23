/* jshint qunit: true */
/* eslint-env qunit */
/* eslint-disable no-magic-numbers */

( function() {
	'use strict';

	module( 'Gallery Media Widget' );

	test( 'gallery widget control', function() {
		var GalleryWidgetControl;
		equal( typeof wp.mediaWidgets.controlConstructors.media_gallery, 'function', 'wp.mediaWidgets.controlConstructors.media_gallery is a function' );
		GalleryWidgetControl = wp.mediaWidgets.controlConstructors.media_gallery;
		ok( GalleryWidgetControl.prototype instanceof wp.mediaWidgets.MediaWidgetControl, 'wp.mediaWidgets.controlConstructors.media_gallery subclasses wp.mediaWidgets.MediaWidgetControl' );

		// TODO more tests here.
	});

	// TODO PREVIEW TESTS.

	test( 'gallery media model', function() {
		var GalleryWidgetModel, galleryWidgetModelInstance, attachmentData;
		equal( typeof wp.mediaWidgets.modelConstructors.media_gallery, 'function', 'wp.mediaWidgets.modelConstructors.media_gallery is a function' );
		GalleryWidgetModel = wp.mediaWidgets.modelConstructors.media_gallery;
		ok( GalleryWidgetModel.prototype instanceof wp.mediaWidgets.MediaWidgetModel, 'wp.mediaWidgets.modelConstructors.media_gallery subclasses wp.mediaWidgets.MediaWidgetModel' );

		attachmentData = '[{"id":42,"url":"http://src.wordpress-develop.dev/wp-content/uploads/2017/04/img_20170407_080914.jpg"},{"id":49,"url":"http://src.wordpress-develop.dev/wp-content/uploads/2017/04/img_20170407_080915.jpg"}]';
		galleryWidgetModelInstance = new GalleryWidgetModel();
		_.each( galleryWidgetModelInstance.attributes, function( value, key ) {
			equal( value, GalleryWidgetModel.prototype.schema[ key ][ 'default' ], 'Should properly set default for ' + key );
		});

		// Test removeAttachmentId().
		galleryWidgetModelInstance.set( {
			'attachments': attachmentData,
			'ids': '42,49'
		} );
		galleryWidgetModelInstance.removeAttachmentId();
		equal( galleryWidgetModelInstance.get( 'attachments' ), attachmentData );
		equal( galleryWidgetModelInstance.get( 'ids' ), '42,49' );
		galleryWidgetModelInstance.removeAttachmentId( 49 );
		equal( galleryWidgetModelInstance.get( 'attachments' ), '[{"id":42,"url":"http://src.wordpress-develop.dev/wp-content/uploads/2017/04/img_20170407_080914.jpg"}]' );
		equal( galleryWidgetModelInstance.get( 'ids' ), '42' );
	});

})();
