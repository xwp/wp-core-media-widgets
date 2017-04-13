<?php
/**
 * Widget API: WP_Widget_Media_Video class
 *
 * @package WordPress
 * @subpackage Widgets
 * @since 4.8.0
 */

/**
 * Core class that implements a video widget.
 *
 * @since 4.8.0
 *
 * @todo Refactor this for latest WP_Widget_Media and remove codeCoverageIgnore
 * @codeCoverageIgnore
 * @see WP_Widget
 */
class WP_Widget_Media_Video extends WP_Widget_Media {

	/**
	 * Constructor.
	 *
	 * @since  4.8.0
	 * @access public
	 */
	public function __construct() {
		parent::__construct( 'media_video', __( 'Video' ), array(
			'description' => __( 'Displays a video from the media library or from YouTube, Vimeo, or another provider.' ),
			'mime_type'   => 'video',
		) );

		$this->l10n = array_merge( $this->l10n, array(
			'no_media_selected' => __( 'No video selected' ),
			'select_media' => _x( 'Select Video', 'label for button in the video widget; should not be longer than ~13 characters long' ),
			'change_media' => _x( 'Change Video', 'label for button in the video widget; should not be longer than ~13 characters long' ),
			'edit_media' => _x( 'Edit Video', 'label for button in the video widget; should not be longer than ~13 characters long' ),
			'missing_attachment' => sprintf(
				/* translators: placeholder is URL to media library */
				__( 'We can&#8217;t find that video. Check your <a href="%s">media library</a> and make sure it wasn&#8217;t deleted.' ),
				esc_url( admin_url( 'upload.php' ) )
			),
			/* translators: %d is widget count */
			'media_library_state_multi' => _n_noop( 'Video Widget (%d)', 'Video Widget (%d)' ),
			'media_library_state_single' => __( 'Video Widget' ),
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
				'autoplay' => array(
					'type' => 'boolean',
					'default' => false,
				),
				'caption' => array(
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'wp_kses_post',
				),
				'poster' => array(
					'type' => 'string',
					'default' => '',
					'format' => 'uri',
					'description' => __( 'URL to the poster frame' ),
				),
				'preload' => array(
					'type' => 'string',
					'enum' => array( 'none', 'auto', 'metadata' ),
					'default' => 'none',
				),
				'loop' => array(
					'type' => 'boolean',
					'default' => false,
				),
				'thumbnail_url' => array(
					'type' => 'string',
					'default' => '',
					'format' => 'uri',
					'description' => __( 'URL to the video thumbnail file' ),
				),
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
	 *
	 * @return void
	 */
	public function render_media( $instance ) {
		if ( empty( $instance['attachment_id'] ) && empty( $instance['url'] ) ) {
			return;
		}
		$src = $instance['url'];

		$attachment = get_post( $instance['attachment_id'] );
		if ( $attachment && 'attachment' === $attachment->post_type ) {
			$src = wp_get_attachment_url( $attachment->ID );
		}

		// TODO: height and width.
		echo wp_video_shortcode( array(
			'src' => $src,
			'autoplay' => $instance['autoplay'],
			'poster' => $instance['poster'],
			'preload' => $instance['preload'],
			'loop' => $instance['loop'],
		) );
	}

	/**
	 * Loads the required media files for the media manager and scripts for .
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_scripts() {
		parent::enqueue_admin_scripts();

		$handle = 'media-video-widget';
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

	/**
	 * Render form template scripts.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function render_control_template_scripts() {
		parent::render_control_template_scripts()
		?>
		<script type="text/html" id="tmpl-wp-media-widget-video-preview">
			<# if ( data.error && 'missing_attachment' === data.error ) { #>
				<div class="notice notice-error notice-alt notice-missing-attachment">
					<p><?php echo $this->l10n['missing_attachment']; ?></p>
				</div>
			<# } else if ( data.error ) { #>
				<div class="notice notice-error notice-alt">
					<p><?php _e( 'Unable to preview media due to an unknown error.' ); ?></p>
				</div>
			<# } else if ( data.model && data.model.poster && ! data.model.attachment_id ) { #>
				<a href="{{ data.model.src }}" target="_blank">
					<img class="attachment-thumb" src="{{ data.model.poster }}" draggable="false" />
				</a>
			<# } else if ( data.model && data.model.attachment_id ) { #>
				<?php wp_underscore_video_template() ?>
			<# } #>
		</script>
		<?php
	}
}
