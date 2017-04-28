/* jshint qunit: true */
/* eslint-env qunit */
/* eslint-disable no-magic-numbers */

( function() {
	'use strict';

	module( 'Video Media Widget' );

	test( 'video widget control', function() {
		var VideoWidgetControl, videoWidgetControlInstance, videoWidgetModelInstance, mappedProps, testVideoUrl, resetProps;
		testVideoUrl = 'https://videos.files.wordpress.com/AHz0Ca46/wp4-7-vaughan-r8-mastered_hd.mp4';
		equal( typeof wp.mediaWidgets.controlConstructors.media_video, 'function', 'wp.mediaWidgets.controlConstructors.media_video is a function' );
		VideoWidgetControl = wp.mediaWidgets.controlConstructors.media_video;
		ok( VideoWidgetControl.prototype instanceof wp.mediaWidgets.MediaWidgetControl, 'wp.mediaWidgets.controlConstructors.media_video subclasses wp.mediaWidgets.MediaWidgetControl' );

		videoWidgetModelInstance = new wp.mediaWidgets.modelConstructors.media_video();
		videoWidgetControlInstance = new VideoWidgetControl({
			model: videoWidgetModelInstance
		});

		// Test mapModelToMediaFrameProps().
		videoWidgetControlInstance.model.set({ error: false, url: testVideoUrl, loop: false, preload: 'meta' });
		mappedProps = videoWidgetControlInstance.mapModelToMediaFrameProps( videoWidgetControlInstance.model.toJSON() );
		equal( mappedProps.url, testVideoUrl, 'mapModelToMediaFrameProps should set url' );
		equal( mappedProps.loop, false, 'mapModelToMediaFrameProps should set loop' );
		equal( mappedProps.preload, 'meta', 'mapModelToMediaFrameProps should set preload' );

		// Test getResetProps().
		videoWidgetControlInstance.model.set({ poster: 'http://s.w.org/style/images/wp-header-logo.png' });
		resetProps = videoWidgetControlInstance.getResetProps( { url: 'https://www.youtube.com/watch?v=ea2WoUtbzuw' } );
		equal( resetProps.poster, '', 'getResetProps() should set field back to default when reset_on_media_change is true, and no new prop is set.' );
		resetProps = videoWidgetControlInstance.getResetProps( { url: 'https://www.youtube.com/watch?v=ea2WoUtbzuw', poster: 'https://i0.wp.com/themes.svn.wordpress.org/twentyseventeen/1.2/screenshot.png' } );
		equal( resetProps.poster, undefined, 'getResetProps() should not set field back to default when reset_on_media_change is true, and a new prop is set.' );
	});

	asyncTest( 'video widget control renderPreview', function() {
		var videoWidgetControlInstance, videoWidgetModelInstance;

		expect( 2 );

		videoWidgetModelInstance = new wp.mediaWidgets.modelConstructors.media_video();
		videoWidgetControlInstance = new wp.mediaWidgets.controlConstructors.media_video({
			model: videoWidgetModelInstance
		});
		equal( videoWidgetControlInstance.$el.find( 'a' ).length, 0, 'No video links should be rendered' );
		videoWidgetControlInstance.model.set({ error: false, url: 'https://videos.files.wordpress.com/AHz0Ca46/wp4-7-vaughan-r8-mastered_hd.mp4' });

		// Due to renderPreview being deferred.
		setTimeout( function() {
			equal( videoWidgetControlInstance.$el.find( 'a[href="https://videos.files.wordpress.com/AHz0Ca46/wp4-7-vaughan-r8-mastered_hd.mp4"]' ).length, 1, 'One video link should be rendered' );
		}, 50 );

		setTimeout( start, 1000 );
	});

	test( 'video media model', function() {
		var VideoWidgetModel, videoWidgetModelInstance;
		equal( typeof wp.mediaWidgets.modelConstructors.media_video, 'function', 'wp.mediaWidgets.modelConstructors.media_video is a function' );
		VideoWidgetModel = wp.mediaWidgets.modelConstructors.media_video;
		ok( VideoWidgetModel.prototype instanceof wp.mediaWidgets.MediaWidgetModel, 'wp.mediaWidgets.modelConstructors.media_video subclasses wp.mediaWidgets.MediaWidgetModel' );

		videoWidgetModelInstance = new VideoWidgetModel();
		_.each( videoWidgetModelInstance.attributes, function( value, key ) {
			equal( value, VideoWidgetModel.prototype.schema[ key ][ 'default' ], 'Should properly set default for ' + key );
		});
	});

})();
