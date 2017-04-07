<?php
/**
 * Widget API: WP_Widget_Audio class
 *
 * @package WordPress
 * @subpackage Widgets
 * @since 4.8.0
 */

/**
 * Core class that implements an audio widget.
 *
 * @since 4.8.0
 *
 * @codeCoverageIgnore
 * @see WP_Widget
 */
class WP_Widget_Audio extends WP_Widget_Media {

	/**
	 * Constructor.
	 *
	 * @since  4.8.0
	 * @access public
	 */
	public function __construct() {
		parent::__construct( 'media_audio', __( 'Audio' ), array(
			'description' => __( 'Displays an audio file.' ),
			'mime_type'   => 'audio',
		) );
	}

	/**
	 * Render the media on the frontend.
	 *
	 * @since  4.8.0
	 * @access public
	 *
	 * @param array $instance Widget instance props.
	 * @return void
	 */
	public function render_media( $instance ) {

		// @todo Support external audio defined by 'url' only.
		if ( empty( $instance['attachment_id'] ) ) {
			return;
		}

		$attachment = get_post( $instance['attachment_id'] );
		if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
			return;
		}

		if ( in_array( $instance['link'], array( 'file', 'post' ), true ) ) {
			echo $this->create_link_for( $attachment, $instance['link'] );
		} else {
			echo wp_audio_shortcode( array(
				'src' => wp_get_attachment_url( $attachment->ID ),
			) );
		}
	}

	/**
	 * Render form template scripts.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function render_control_template_scripts() {
		parent::render_control_template_scripts();

		echo '<script type="text/html" id="tmpl-wp-media-widget-audio-preview">' . "\n";
		wp_underscore_audio_template();
		echo '</script>' . "\n";
	}

	/**
	 * Loads the required media files for the media manager and scripts for media widgets.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_scripts() {
		parent::enqueue_admin_scripts();

		$handle = 'media-audio-widget';
		wp_enqueue_script( $handle );

		$exported_schema = array();
		foreach ( $this->get_instance_schema() as $field => $field_schema ) {
			$exported_schema[ $field ] = wp_array_slice_assoc( $field_schema, array( 'type', 'default', 'enum', 'minimum', 'format' ) );
		}
		wp_add_inline_script(
			$handle,
			sprintf(
				'wp.mediaWidgets.modelConstructors[ %s ].prototype.schema = %s;',
				wp_json_encode( $this->id_base ),
				wp_json_encode( $exported_schema )
			)
		);

		wp_add_inline_script(
			$handle,
			sprintf(
				'
						wp.mediaWidgets.controlConstructors[ %1$s ].prototype.mime_type = %2$s;
						_.extend( wp.mediaWidgets.controlConstructors[ %1$s ].prototype.l10n, %3$s );
					',
				wp_json_encode( $this->id_base ),
				wp_json_encode( $this->widget_options['mime_type'] ),
				wp_json_encode( $this->l10n )
			)
		);
	}
}
