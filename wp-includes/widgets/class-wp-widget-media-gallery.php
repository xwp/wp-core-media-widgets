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
		return array(
			'title' => array(
				'type' => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_text_field',
				'description' => __( 'Title for the widget' ),
				'should_preview_update' => false,
			),
			'ids' => array(
				'type' => 'string',
				'default' => '',
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
			'link_type' => array(
				'type' => 'string',
				'enum' => array( 'none', 'file', 'post' ),
				'default' => 'none',
				'media_prop' => 'link',
				'should_preview_update' => false,
			),
			'orderby_random' => array(
				'type'                  => 'boolean',
				'default'               => false,
				'media_prop'            => '_orderbyRandom',
				'should_preview_update' => false,
			),
			'attachments' => array(
				'type'                  => 'string',
				'default' => '',
			),
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
		$shortcode_atts = array(
			'ids' => $instance['ids'],
		);
		// @codingStandardsIgnoreStart
		if ( $instance['orderby_random'] ) {
			$shortcode_atts['orderby'] = 'rand';
		}
		// @codingStandardsIgnoreEnd

		echo gallery_shortcode( $shortcode_atts );
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
			<# data.attachments = data.attachments ? JSON.parse(data.attachments) : ''; #>
			<# if ( Array.isArray( data.attachments ) && data.attachments.length ) { #>
				<div class="gallery gallery-columns-{{ data.columns }}">
					<# _.each( data.attachments, function( attachment, index ) { #>
						<dl class="gallery-item">
							<dt class="gallery-icon">
							<# if ( attachment.sizes.thumbnail ) { #>
								<img src="{{ attachment.sizes.thumbnail.url }}" width="{{ attachment.sizes.thumbnail.width }}" height="{{ attachment.sizes.thumbnail.height }}" alt="" />
							<# } else { #>
								<img src="{{ attachment.url }}" alt="" />
							<# } #>
							</dt>
							<# if ( attachment.caption ) { #>
								<dd class="wp-caption-text gallery-caption">
									{{{ data.verifyHTML( attachment.caption ) }}}
								</dd>
							<# } #>
						</dl>
						<# if ( index % data.columns === data.columns - 1 ) { #>
							<br style="clear: both;">
						<# } #>
					<# } ); #>
				</div>
			<# } else { #>
				<div class="attachment-media-view">
					<p class="placeholder"><?php echo esc_html( $this->l10n['no_media_selected'] ); ?></p>
				</div>
			<# } #>
		</script>
		<?php
	}

	/**
	 * Whether the widget has content to show.
	 *
	 * @since 4.8.0
	 * @access protected
	 *
	 * @param array $instance Widget instance props.
	 * @return bool Whether widget has content.
	 */
	protected function has_content( $instance ) {

		if ( ! empty( $instance['ids'] ) ) {

			$attachments = explode( ',', $instance['ids'] );
			foreach ( $attachments as $attachment ) {
				if ( 'attachment' !== get_post_type( $attachment ) ) {

					return false;
				}
			}
			return true;
		} else {

			return false;
		}
	}
}
