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

// Register WP-CLI command for generating QUnit test suite.
if ( defined( 'WP_CLI' ) ) {
	require_once dirname( __FILE__ ) . '/php/class-media-widgets-wp-cli-command.php';
	WP_CLI::add_command( 'media-widgets', new Media_Widgets_WP_CLI_Command() );
}

/**
 * Register widget scripts.
 *
 * @codeCoverageIgnore
 * @param WP_Scripts $scripts Scripts.
 */
function wp32417_default_scripts( WP_Scripts $scripts ) {
	$scripts->add( 'media-widgets', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-widgets.js', array( 'jquery', 'media-models', 'media-views' ) );
	$scripts->add_inline_script( 'media-widgets', 'wp.mediaWidgets.init();', 'after' );

	$scripts->add( 'media-audio-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-audio-widget.js', array( 'media-widgets' ) );
	$scripts->add( 'media-image-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-image-widget.js', array( 'media-widgets' ) );

	$scripts->add( 'media-video-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-video-widget.js', array( 'media-widgets' ) );

	$scripts->add_inline_script( 'customize-selective-refresh', file_get_contents( dirname( __FILE__ ) . '/wp-includes/js/customize-selective-refresh-extras.js' ) );
}
add_action( 'wp_default_scripts', 'wp32417_default_scripts' );

/**
 * Register widget styles.
 *
 * @codeCoverageIgnore
 * @param WP_Styles $styles Styles.
 */
function wp32417_default_styles( WP_Styles $styles ) {
	$styles->add( 'media-widgets', plugin_dir_url( __FILE__ ) . 'wp-admin/css/widgets/media-widgets.css', array( 'media-views' ) );
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
add_action( 'wp_enqueue_scripts', 'wp32417_custom_theme_styles', 11 );

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
	require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media.php' );
	require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media-audio.php' );
	require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media-image.php' );
	require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media-video.php' );

	register_widget( 'WP_Widget_Media_Image' );
	register_widget( 'WP_Widget_Media_Video' );
	register_widget( 'WP_Widget_Media_Audio' );
}
add_action( 'widgets_init', 'wp32417_widgets_init' );

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
