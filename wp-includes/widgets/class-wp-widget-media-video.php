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
		$schema = array_merge(
			parent::get_instance_schema(),
			array(
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
					'should_preview_update' => false,
				),
				'loop' => array(
					'type' => 'boolean',
					'default' => false,
					'should_preview_update' => false,
				),
				'width' => array(
					'type' => 'integer',
					'minimum' => 0,
					'default' => 640, // Same as default shortcode attribute in wp_video_shortcode().
					'description' => __( 'Video width' ),
				),
				'height' => array(
					'type' => 'integer',
					'minimum' => 0,
					'default' => 360, // Same as default shortcode attribute in wp_video_shortcode().
					'description' => __( 'Video height' ),
				),
				'content' => array(
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'wp_kses_post',
					'description' => __( 'Tracks (subtitles, captions, descriptions, chapters, or metadata)' ),
					'should_preview_update' => false,
				),
			)
		);

		foreach ( wp_get_video_extensions() as $video_extension ) {
			$schema[ $video_extension ] = array(
				'type' => 'string',
				'default' => '',
				'format' => 'uri',
				/* translators: placeholder is video extension */
				'description' => sprintf( __( 'URL to the %s video source file' ), $video_extension ),
			);
		}

		// TODO: height and width?
		return $schema;
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
		$instance = array_merge( wp_list_pluck( $this->get_instance_schema(), 'default' ), $instance );
		if ( empty( $instance['attachment_id'] ) && empty( $instance['url'] ) ) {
			return;
		}

		$attachment = null;
		if ( $this->is_attachment_with_mime_type( $instance['attachment_id'], $this->widget_options['mime_type'] ) ) {
			$attachment = get_post( $instance['attachment_id'] );
		}

		if ( $attachment ) {
			$src = wp_get_attachment_url( $attachment->ID );
		} else {
			$src = $instance['url'];
		}

		if ( empty( $src ) ) {
			return;
		}

		$schema = $this->get_instance_schema();
		if ( empty( $instance['width'] ) ) {
			$instance['width'] = $schema['width']['default'];
		}
		if ( empty( $instance['height'] ) ) {
			$instance['height'] = $schema['height']['default'];
		}

		echo wp_video_shortcode(
			array_merge(
				$instance,
				compact( 'src' )
			),
			$instance['content']
		);
	}

	/**
	 * Enqueue preview scripts.
	 *
	 * These scripts normally are enqueued just-in-time when a video shortcode is used.
	 * In the customizer, however, widgets can be dynamically added and rendered via
	 * selective refresh, and so it is important to unconditionally enqueue them in
	 * case a widget does get added.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_preview_scripts() {
		/** This filter is documented in wp-includes/media.php */
		if ( 'mediaelement' === apply_filters( 'wp_video_shortcode_library', 'mediaelement' ) ) {
			wp_enqueue_style( 'wp-mediaelement' );
			wp_enqueue_script( 'wp-mediaelement' );
		}

		// Enqueue script needed by Vimeo; see wp_video_shortcode().
		wp_enqueue_script( 'froogaloop' );
	}

	/**
	 * Loads the required scripts and styles for the widget control.
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
			$exported_schema[ $field ] = wp_array_slice_assoc( $field_schema, array( 'type', 'default', 'enum', 'minimum', 'format', 'media_prop' ) );
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
			<# } else if ( data.model && ! data.model.attachment_id ) { #>
				<a href="{{ data.model.src }}" target="_blank" class="media-widget-video-link{{ ! data.model.poster ? ' no-poster' : '' }}">
					<img class="attachment-thumb" src="{{ data.model.poster }}" draggable="false" />
					<span class="dashicons dashicons-format-video"></span>
				</a>
			<# } else if ( data.model && data.model.attachment_id ) { #>
				<?php wp_underscore_video_template() ?>
			<# } #>
		</script>
		<?php
	}
}
