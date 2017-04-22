<?php
/**
 * Widget API: WP_Widget_Media_Audio class
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
 * @see WP_Widget
 */
class WP_Widget_Media_Audio extends WP_Widget_Media {

	/**
	 * Constructor.
	 *
	 * @since  4.8.0
	 * @access public
	 */
	public function __construct() {
		parent::__construct( 'media_audio', __( 'Audio' ), array(
			'description' => __( 'Displays an audio player.' ),
			'mime_type'   => 'audio',
		) );

		$this->l10n = array_merge( $this->l10n, array(
			'no_media_selected' => __( 'No audio selected' ),
			'select_media' => _x( 'Select File', 'label for button in the audio widget; should not be longer than ~13 characters long' ),
			'change_media' => _x( 'Change Audio', 'label for button in the audio widget; should not be longer than ~13 characters long' ),
			'edit_media' => _x( 'Edit Audio', 'label for button in the audio widget; should not be longer than ~13 characters long' ),
			'missing_attachment' => sprintf(
				/* translators: placeholder is URL to media library */
				__( 'We can&#8217;t find that audio file. Check your <a href="%s">media library</a> and make sure it wasn&#8217;t deleted.' ),
				esc_url( admin_url( 'upload.php' ) )
			),
			/* translators: %d is widget count */
			'media_library_state_multi' => _n_noop( 'Audio Widget (%d)', 'Audio Widget (%d)' ),
			'media_library_state_single' => __( 'Audio Widget' ),
		) );
	}

	/**
	 * Get schema for properties of a widget instance (item).
	 *
	 * @since  4.8.0
	 * @access public
	 *
	 * @see WP_REST_Controller::get_item_schema()
	 * @see WP_REST_Controller::get_additional_fields()
	 * @link https://core.trac.wordpress.org/ticket/35574
	 * @return array Schema for properties.
	 */
	public function get_instance_schema() {
		return array_merge(
			parent::get_instance_schema(),
			array(
				/* TODO */
			)
		);
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
		$attachment = null;
		if ( $instance['attachment_id'] ) {
			$attachment = get_post( $instance['attachment_id'] );
		}
		if ( $attachment && 'attachment' === $attachment->post_type ) {

			if ( in_array( $instance['link_type'], array( 'file', 'post' ), true ) ) {
				echo $this->create_link_for( $attachment, $instance['link'] );
				return;
			} else {
				$src = wp_get_attachment_url( $attachment->ID );
			}
		} else {

			if ( empty( $instance['url'] ) ) {
				return;
			}

			$src = $instance['url'];
		}

		echo wp_audio_shortcode( array(
			'src' => $src,
		) );
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
