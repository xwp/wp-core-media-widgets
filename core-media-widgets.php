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

/**
 * Register widget scripts.
 *
 * @param WP_Scripts $scripts Scripts.
 */
function wp32417_default_scripts( WP_Scripts $scripts ) {
	$scripts->add( 'media-widgets', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-widgets.js', array( 'jquery', 'media-models', 'media-views' ) );
	$scripts->add_inline_script( 'media-widgets', 'wp.mediaWidgets.init();', 'after' );

	$scripts->add( 'media-image-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-image-widget.js', array( 'media-widgets' ) );
	// @todo $scripts->add( 'media-video-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-image-widget.js', array( 'media-widgets', 'wp-mediaelement' ) );
	// @todo  $scripts->add( 'media-audio-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-image-widget.js', array( 'media-widgets', 'wp-mediaelement' ) );

	$scripts->add_inline_script( 'customize-selective-refresh', file_get_contents( dirname( __FILE__ ) . '/wp-includes/js/customize-selective-refresh-extras.js' ) );
}
add_action( 'wp_default_scripts', 'wp32417_default_scripts' );

/**
 * Register widget styles.
 *
 * @param WP_Styles $styles Styles.
 */
function wp32417_default_styles( WP_Styles $styles ) {
	$styles->add( 'media-widgets', plugin_dir_url( __FILE__ ) . 'wp-admin/css/widgets/media-widgets.css', array( 'media-views' ) );
}
add_action( 'wp_default_styles', 'wp32417_default_styles' );

/**
 * Style fixes for default themes.
 */
function wp32417_custom_theme_styles() {
	if ( wp_style_is( 'twentysixteen-style' ) ) {
		wp_add_inline_style( 'twentysixteen-style', '
			.widget:before,.widget:after { content: ""; display: table; }
			.widget:after { clear: both; }
		' );
	}

	if ( 'twentyten' === get_template() ) {
		add_action( 'wp_head', 'wp32417_twentyten_styles' );
	}
}
add_action( 'wp_enqueue_scripts', 'wp32417_custom_theme_styles', 11 );

/**
 * Style fixes for Twenty Ten.
 */
function wp32417_twentyten_styles() {
	echo '<style>.widget-container .wp-caption { max-width: 100% !important; }</style>';
}

/**
 * Register widget.
 */
function wp32417_widgets_init() {
	require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media.php' );
	// require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-audio.php' );
	require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-image.php' );
	// require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-video.php' );

	// register_widget( 'WP_Widget_Audio' );
	register_widget( 'WP_Widget_Image' );
	// register_widget( 'WP_Widget_Video' );
}
add_action( 'widgets_init', 'wp32417_widgets_init' );
