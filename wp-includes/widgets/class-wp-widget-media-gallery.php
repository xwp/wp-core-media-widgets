<?php
/**
 * Widget API: WP_Widget_Media_Gallery class
 *
 * @package WordPress
 * @subpackage Widgets
 * @since 4.8.0
 */

/**
 * Core class that implements a gallery widget.
 *
 * @since 4.8.0
 *
 * @see WP_Widget
 */
class WP_Widget_Media_Gallery extends WP_Widget_Media {

	/**
	 * Constructor.
	 *
	 * @since  4.8.0
	 * @access public
	 */
	public function __construct() {
		parent::__construct( 'media_gallery', __( 'Gallery' ), array(
			'description' => __( 'Displays an image gallery.' ),
			'mime_type'   => 'image',
		) );

		$this->l10n = array_merge( $this->l10n, array(
			'no_media_selected' => __( 'No images selected' ),
			'select_media' => _x( 'Select Images', 'label for button in the gallery widget; should not be longer than ~13 characters long' ),
			'change_media' => _x( 'Add Image', 'label for button in the gallery widget; should not be longer than ~13 characters long' ),
			'edit_media' => _x( 'Edit Gallery', 'label for button in the gallery widget; should not be longer than ~13 characters long' ),
			'missing_attachment' => sprintf(
			/* translators: placeholder is URL to media library */
				__( 'We can&#8217;t find that gallery. Check your <a href="%s">media library</a> and make sure it wasn&#8217;t deleted.' ),
				esc_url( admin_url( 'upload.php' ) )
			),
			'media_library_state_multi' => '',
			'media_library_state_single' => '',
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
				'ids' => array(
					'type' => 'array',
					'default' => array(),
				),
				'columns' => array(
					'type' => 'integer',
					'default' => 3,
				),
				'size' => array(
					'type' => 'string',
					'enum' => array_merge( get_intermediate_image_sizes(), array( 'full', 'custom' ) ),
					'default' => 'thumbnail',
				),
				'link' => array(
					'type' => 'string',
					'default' => '',
					'format' => 'uri',
					'sanitize_callback' => 'esc_url',
					'should_preview_update' => false,
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
	 * @return void
	 */
	public function render_media( $instance ) {
		$instance = array_merge( wp_list_pluck( $this->get_instance_schema(), 'default' ), $instance );

		echo gallery_shortcode( array(
			'ids' => $instance['ids'],
		) );
	}

	/**
	 * Loads the required media files for the media manager and scripts for media widgets.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_scripts() {
		parent::enqueue_admin_scripts();

		$handle = 'media-gallery-widget';
		wp_enqueue_script( $handle );

		$exported_schema = array();
		foreach ( $this->get_instance_schema() as $field => $field_schema ) {
			$exported_schema[ $field ] = wp_array_slice_assoc( $field_schema, array( 'type', 'default', 'enum', 'minimum', 'format', 'media_prop', 'should_preview_update' ) );
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
		parent::render_control_template_scripts();

		?>
		<script type="text/html" id="tmpl-wp-media-widget-gallery-preview">
			<# var describedById = 'describedBy-' + String( Math.random() ); #>

			<# if ( data.error && 'missing_attachment' === data.error ) { #>
				<div class="notice notice-error notice-alt notice-missing-attachment">
					<p><?php echo $this->l10n['missing_attachment']; ?></p>
				</div>
			<# } else { #>
				<div class="attachment-media-view">
					<p class="placeholder"><?php echo esc_html( $this->l10n['no_media_selected'] ); ?></p>
				</div>
			<# } #>
		</script>
		<?php
	}
}
