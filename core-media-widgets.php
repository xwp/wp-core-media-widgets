<?php
/**
 * Plugin Name: Core Media Widgets
 * Version: 0.1.0
 * Description: Adding images to your widget areas is a common, yet currently incredibly tedious task -- you need to upload it in your media library, find the url, copy the url, and then manually add an image tag inside of a text widget. That's a lot to ask for a beginner user to do. We should include a default image widget in core to make this task easier.
 * Author: WordPress.org
 * Plugin URI: https://core.trac.wordpress.org/ticket/32417
 * Domain Path: /languages
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2 or, at
 * your discretion, any later version, as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * @package WordPress
 */

define( 'WP_CORE_MEDIA_WIDGETS_MERGED', file_exists( ABSPATH . 'wp-includes/widgets/class-wp-widget-media.php' ) );

/**
 * Register widget scripts.
 *
 * @codeCoverageIgnore
 * @param WP_Scripts $scripts Scripts.
 */
function wp32417_default_scripts( WP_Scripts $scripts ) {
	$handle = 'media-widgets';
	$src = plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-widgets.js';
	if ( $scripts->query( $handle, 'registered' ) ) {
		$scripts->registered[ $handle ] = $src;
	} else {
		$scripts->add( $handle, $src, array( 'jquery', 'media-models', 'media-views' ) );
		$scripts->add_inline_script( 'media-widgets', 'wp.mediaWidgets.init();', 'after' );
	}

	$handle = 'media-image-widget';
	$src = plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-image-widget.js';
	if ( $scripts->query( $handle, 'registered' ) ) {
		$scripts->registered[ $handle ] = $src;
	} else {
		$scripts->add( $handle, $src, array( 'media-widgets' ) );
	}

	/* TODO: $scripts->add( 'media-video-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-image-widget.js', array( 'media-widgets', 'wp-mediaelement' ) ); */

	/* TODO: $scripts->add( 'media-audio-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-image-widget.js', array( 'media-widgets', 'wp-mediaelement' ) ); */

	if ( ! WP_CORE_MEDIA_WIDGETS_MERGED ) {
		$scripts->add_inline_script( 'customize-selective-refresh', file_get_contents( dirname( __FILE__ ) . '/wp-includes/js/customize-selective-refresh-extras.js' ) );
	}
}
add_action( 'wp_default_scripts', 'wp32417_default_scripts' );

/**
 * Register widget styles.
 *
 * @codeCoverageIgnore
 * @param WP_Styles $styles Styles.
 */
function wp32417_default_styles( WP_Styles $styles ) {
	$handle = 'media-widgets';
	$src = plugin_dir_url( __FILE__ ) . 'wp-admin/css/widgets/media-widgets.css';
	if ( $styles->query( $handle, 'registered' ) ) {
		$styles->registered[ $handle ] = $src;
	} else {
		$styles->add( $handle, $src, array( 'media-views' ) );
	}
}
add_action( 'wp_default_styles', 'wp32417_default_styles' );

/**
 * Style fixes for default themes.
 *
 * @codeCoverageIgnore
 */
function wp32417_custom_theme_styles() {
	if ( 'twentyten' === get_template() ) {
		add_action( 'wp_head', 'wp32417_twentyten_styles' );
	}
}
if ( ! WP_CORE_MEDIA_WIDGETS_MERGED ) {
	add_action( 'wp_enqueue_scripts', 'wp32417_custom_theme_styles', 11 );
}

/**
 * Style fixes for Twenty Ten.
 *
 * @codeCoverageIgnore
 */
function wp32417_twentyten_styles() {
	echo '<style>.widget-container .wp-caption { max-width: 100% !important; }</style>';
}

/**
 * Register widget.
 *
 * @codeCoverageIgnore
 */
function wp32417_widgets_init() {

	register_widget( 'WP_Widget_Image' );

	/* TODO: register_widget( 'WP_Widget_Audio' ); */

	/* TODO: register_widget( 'WP_Widget_Video' ); */
}
add_action( 'widgets_init', 'wp32417_widgets_init', 0 );

/**
 * Determines if Widgets library should be loaded.
 *
 * This is a forked override of the core function `wp_maybe_load_widgets()` to
 * load our copy of default-widgets.php
 *
 * @see wp_maybe_load_widgets()
 */
function wp32417_maybe_load_widgets() {

	/** This filter is documented in wp-includes/functions.php */
	if ( ! apply_filters( 'load_default_widgets', true ) ) {
		return;
	}

	// Require version of file forked from from 4.7.3 that does not include media widgets.
	require_once dirname( __FILE__ ) . '/wp-includes/default-widgets.php';

	// Require media widgets from plugin instead of core.
	require_once dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media.php';
	require_once dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-image.php';

	/* TODO: require_once dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-audio.php'; */

	/* TODO: require_once dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-video.php'; */

	add_action( '_admin_menu', 'wp_widgets_add_menu' );
}
remove_action( 'plugins_loaded', 'wp_maybe_load_widgets', 0 );
add_action( 'plugins_loaded', 'wp32417_maybe_load_widgets', 0 );

/**
 * Add align classname to the alignment container in .attachment-display-settings.
 *
 * @see wp_print_media_templates()
 * @todo For Core merge, this should be patched in \wp_print_media_templates().
 */
function wp32417_add_classname_to_display_settings() {
	?>
	<script>
		(function( templateEl ) {
			if ( ! templateEl ) {
				return;
			}
			templateEl.text = templateEl.text.replace( /(<label class="setting)(?=">\s*<span>[^<]+?<\/span>\s*<select class="alignment")/, '$1 align' );
		}( document.getElementById( 'tmpl-attachment-display-settings' ) ));
	</script>
	<?php
}
add_action( 'print_media_templates', 'wp32417_add_classname_to_display_settings' );
