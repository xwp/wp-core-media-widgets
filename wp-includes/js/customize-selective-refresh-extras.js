/* global wp */
(function( api ) {
	'use strict';

	/*
	 * The following logic should be placed at https://github.com/WordPress/wordpress-develop/blob/4.7.2/src/wp-includes/js/customize-selective-refresh.js#L471
	 */
	api.selectiveRefresh.bind( 'partial-content-rendered', function initializeMediaElements() {

		/*
		 * Note that the 'wp_audio_shortcode_library' and 'wp_video_shortcode_library' filters
		 * will determine whether or not wp.mediaelement is loaded and whether it will
		 * initialize audio and video respectively. See also https://core.trac.wordpress.org/ticket/40144
		 */
		if ( wp.mediaelement ) {
			wp.mediaelement.initialize();
		}
	});

})( wp.customize );
