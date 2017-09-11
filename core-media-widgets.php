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

define( 'WP_CORE_MEDIA_WIDGETS_MERGED',      file_exists( ABSPATH . 'wp-includes/widgets/class-wp-widget-media.php' ) );
define( 'WP_CORE_GALLERY_WIDGET_MERGED',     file_exists( ABSPATH . 'wp-includes/widgets/class-wp-widget-media-gallery.php' ) );
define( 'WP_CORE_VISUAL_TEXT_WIDGET_MERGED', file_exists( ABSPATH . 'wp-admin/js/widgets/text-widgets.js' ) );

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
	if ( function_exists( 'wp_enqueue_editor' ) && ! WP_CORE_VISUAL_TEXT_WIDGET_MERGED ) {
		$scripts->add( 'text-widgets', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/text-widgets.js', array( 'jquery', 'backbone', 'editor', 'wp-util' ) );
		$scripts->add_inline_script( 'text-widgets', 'wp.textWidgets.init();', 'after' );
	}

	$handle = 'media-widgets';
	$src = plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-widgets.js';
	if ( ! $scripts->query( $handle, 'registered' ) ) {
		$scripts->add( $handle, $src, array( 'jquery', 'media-models', 'media-views' ) );
		$scripts->add_inline_script( 'media-widgets', 'wp.mediaWidgets.init();', 'after' );
	}

	$handle = 'media-image-widget';
	$src = plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-image-widget.js';
	if ( ! $scripts->query( $handle, 'registered' ) ) {
		$scripts->add( $handle, $src, array( 'media-widgets' ) );
	}

	$handle = 'media-video-widget';
	$src = plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-video-widget.js';
	if ( ! $scripts->query( $handle, 'registered' ) ) {
		$scripts->add( $handle, $src, array( 'media-widgets', 'media-audiovideo' ) );
	}

	$handle = 'media-audio-widget';
	$src = plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-audio-widget.js';
	if ( ! $scripts->query( $handle, 'registered' ) ) {
		$scripts->add( $handle, $src, array( 'media-widgets', 'media-audiovideo' ) );
	}

	$scripts->add( 'media-gallery-widget', plugin_dir_url( __FILE__ ) . 'wp-admin/js/widgets/media-gallery-widget.js', array( 'media-widgets' ) );

	if ( ! WP_CORE_MEDIA_WIDGETS_MERGED ) {
		$scripts->add_inline_script( 'customize-selective-refresh', file_get_contents( dirname( __FILE__ ) . '/wp-includes/js/customize-selective-refresh-extras.js' ) );
	}
}
add_action( 'wp_default_scripts', 'wp32417_default_scripts' );

/**
 * Add filters that will eventually reside in default-filters.php
 */
function wp32417_add_default_filters() {
	add_filter( 'widget_text_content', 'capital_P_dangit', 11 );
	add_filter( 'widget_text_content', 'wptexturize' );
	add_filter( 'widget_text_content', 'convert_smilies', 20 );
	add_filter( 'widget_text_content', 'wpautop' );
}
if ( ! WP_CORE_VISUAL_TEXT_WIDGET_MERGED ) {
	add_action( 'plugins_loaded', 'wp32417_add_default_filters' );
}

/**
 * Register widget styles.
 *
 * @codeCoverageIgnore
 * @param WP_Styles $styles Styles.
 */
function wp32417_default_styles( WP_Styles $styles ) {
	$handle = 'media-widgets';
	if ( ! WP_CORE_MEDIA_WIDGETS_MERGED ) {
		$src = plugin_dir_url( __FILE__ ) . 'wp-admin/css/widgets/media-widgets.css';
		$styles->add( $handle, $src, array( 'media-views' ) );
	}

	$handle = 'media-gallery-widget';
	if ( ! WP_CORE_GALLERY_WIDGET_MERGED ) {
		$src = plugin_dir_url( __FILE__ ) . 'wp-admin/css/widgets/media-gallery-widget.css';
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
	$class_files = array(
		'WP_Widget_Media'         => dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media.php',
		'WP_Widget_Media_Image'   => dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media-image.php',
		'WP_Widget_Media_Video'   => dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media-video.php',
		'WP_Widget_Media_Audio'   => dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media-audio.php',
		'WP_Widget_Media_Gallery' => dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-media-gallery.php',
	);
	foreach ( $class_files as $class => $file ) {
		if ( ! class_exists( $class ) ) {
			require_once( $file );

			if ( 'WP_Widget_Media' !== $class ) {
				register_widget( $class );
			}
		}
	}

	if ( function_exists( 'wp_enqueue_editor' ) && ! WP_CORE_VISUAL_TEXT_WIDGET_MERGED ) {
		require_once( dirname( __FILE__ ) . '/wp-includes/widgets/class-wp-widget-visual-text.php' );
		unregister_widget( 'WP_Widget_Text' );
		register_widget( 'WP_Widget_Visual_Text' );
	}
}
add_action( 'widgets_init', 'wp32417_widgets_init', 0 );

/**
 * Add align class name to the alignment container in .attachment-display-settings.
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

/**
 * Add autoplay class name to the checkbox container elements for audio/video details.
 *
 * @see wp_print_media_templates()
 * @todo For Core merge, this should be patched in \wp_print_media_templates().
 */
function wp32417_add_classname_to_audio_video_details_frames() {
	?>
	<script>
		(function( audioTemplateEl, videoTemplateEl ) {
			var regex = /(<label class="setting checkbox-setting)(?=">\s*<input type="checkbox" data-setting="autoplay")/;
			if ( audioTemplateEl ) {
				audioTemplateEl.text = audioTemplateEl.text.replace( regex, '$1 autoplay' );
			}
			if ( videoTemplateEl ) {
				videoTemplateEl.text = videoTemplateEl.text.replace( regex, '$1 autoplay' );
			}
		}( document.getElementById( 'tmpl-audio-details' ), document.getElementById( 'tmpl-video-details' ) ));
	</script>
	<?php
}
add_action( 'print_media_templates', 'wp32417_add_classname_to_audio_video_details_frames' );
