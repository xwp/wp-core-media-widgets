/* global wp */
(function( api ) {
	'use strict';

	/*
	 * The following logic should be placed at https://github.com/WordPress/wordpress-develop/blob/4.7.2/src/wp-includes/js/customize-selective-refresh.js#L471
	 */
	api.selectiveRefresh.bind( 'partial-content-rendered', function initializeMediaElements() {

		// @todo If audio, first ensure that wp_audio_shortcode_library filters away mediaelement; if video, check wp_video_shortcode_library filters the same.
		if ( wp.mediaelement ) {
			wp.mediaelement.initialize();
		}
	} );

})( wp.customize );
