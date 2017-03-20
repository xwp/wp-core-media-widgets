<?php
/**
 * Widget API: WP_Widget_Image class
 *
 * @package WordPress
 * @subpackage Widgets
 * @since 4.8.0
 */

/**
 * Core class that implements an image widget.
 *
 * @since 4.8.0
 *
 * @see WP_Widget
 */
class WP_Widget_Image extends WP_Widget_Media {

	/**
	 * Constructor.
	 *
	 * @since  4.8.0
	 * @access public
	 */
	public function __construct() {
		parent::__construct( 'media_image', __( 'Image' ), array(
			'description' => __( 'Displays an image file.' ),
			'mime_type'   => 'image',
		) );

		$this->l10n = array_merge( $this->l10n, array(
			'change_media' => __( 'Change Image' ),
			'edit_media' => __( 'Edit Image' ),
			'missing_attachment' => sprintf(
				__( 'We can&#8217;t find that image. Check your <a href="%s">media library</a> and make sure it wasn&#8217;t deleted.' ),
				esc_url( admin_url( 'upload.php' ) )
			),
			/* translators: %s is widget count */
			'media_library_state' => _n_noop( 'Image Widget', 'Image Widget (%s)' ),
			'no_media_selected' => __( 'No image selected' ),
			'select_media' => __( 'Select Image' ),
		) );
	}

	/**
	 * Get instance schema.
	 *
	 * This is protected because it may become part of WP_Widget eventually.
	 *
	 * @link https://core.trac.wordpress.org/ticket/35574
	 * @return array
	 */
	protected function get_instance_schema() {
		return array_merge(
			parent::get_instance_schema(),
			array(
				'size' => array(
					'type' => 'string',
					'enum' => array_merge( get_intermediate_image_sizes(), array( 'full', 'custom' ) ),
					'default' => 'full',
				),
				'width' => array( // Via 'customWidth', only when size=custom; otherwise via 'width'.
					'type' => 'integer',
					'minimum' => 0,
					'default' => 0,
				),
				'height' => array( // Via 'customHeight', only when size=custom; otherwise via 'height'.
					'type' => 'integer',
					'minimum' => 0,
					'default' => 0,
				),

				'align' => array(
					'type' => 'string',
					'enum' => array( 'none', 'left', 'right', 'center' ),
					'default' => 'none',
				),
				'caption' => array(
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'alt' => array(
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'link_type' => array( // Via 'link' property.
					'type' => 'string',
					'enum' => array( 'none', 'file', 'post', 'custom' ),
					'default' => 'none',
				),
				'link_url' => array( // Via 'linkUrl' property.
					'type' => 'string',
					'default' => '',
					'format' => 'uri',
				),
				'image_classes' => array( // Via 'extraClasses' property.
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'link_classes' => array( // Via 'linkClassName' property.
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'link_rel' => array( // Via 'linkRel' property.
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'link_target_blank' => array( // Via 'linkTargetBlank' property.
					'type' => 'boolean',
					'default' => false,
				),
				'image_title' => array( // Via 'title' property.
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'sanitize_text_field',
				),

				/*
				 * There are two additional properties exposed by the PostImage modal
				 * that don't seem to be relevant, as they may only be derived read-only
				 * values:
				 * - originalUrl
				 * - aspectRatio
				 * - height (redundant when size is not custom)
				 * - width (redundant when size is not custom)
				 */
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
		$instance = wp_parse_args( $instance, array(
			'size' => 'thumbnail',
		) );

		// @todo Support external images defined by 'url' only.
		if ( empty( $instance['attachment_id'] ) ) {
			return;
		}

		$attachment = get_post( $instance['attachment_id'] );
		if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
			return;
		}

		$caption = $attachment->post_excerpt;
		if ( $instance['caption'] ) {
			$caption = $instance['caption'];
		}

		$image_attributes = array(
			'title' => $instance['image_title'] ? $instance['image_title'] : get_the_title( $attachment->ID ),
			'class' => sprintf( 'image wp-image-%d %s', $attachment->ID, $instance['image_classes'] ),
			'style' => 'max-width: 100%; height: auto;',
		);
		if ( ! $caption ) {
			$image_attributes['class'] .= ' align' . $instance['align'];
		}
		if ( $instance['alt'] ) {
			$image_attributes['alt'] = $instance['alt'];
		}

		$size = $instance['size'];
		if ( 'custom' === $size || ! in_array( $size, array_merge( get_intermediate_image_sizes(), array( 'full' ) ), true ) ) {
			$size = array( $instance['width'], $instance['height'] );
		}

		$image = wp_get_attachment_image( $attachment->ID, $size, false, $image_attributes );

		$url = '';
		if ( 'file' === $instance['link_type'] ) {
			$url = wp_get_attachment_url( $attachment->ID );
		} elseif ( 'post' === $instance['link_type'] ) {
			$url = get_attachment_link( $attachment->ID );
		} elseif ( 'custom' === $instance['link_type'] && ! empty( $instance['link_url'] ) ) {
			$url = $instance['link_url'];
		}

		if ( $url ) {
			$image = sprintf(
				'<a href="%1$s" class="%2$s" rel="%3$s" target="%4$s">%5$s</a>',
				esc_url( $url ),
				esc_attr( $instance['link_classes'] ),
				esc_attr( $instance['link_rel'] ),
				! empty( $instance['link_target_blank'] ) ? '_blank' : '',
				$image
			);
		}

		if ( $caption ) {
			$width = 0;
			$size = _wp_get_image_size_from_meta( $instance['size'], wp_get_attachment_metadata( $attachment->ID ) );
			if ( false !== $size ) {
				$width = $size[0];
			}
			$image = img_caption_shortcode( array(
				'width' => $width,
				'align' => 'align' . $instance['align'],
				'caption' => $caption,
			), $image );
		}

		echo $image;
	}

	/**
	 * Loads the required media files for the media manager and scripts for .
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_scripts() {
		parent::enqueue_admin_scripts();

		$handle = 'media-image-widget';
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
		parent::render_control_template_scripts();

		?>
		<script type="text/html" id="tmpl-wp-media-widget-image-preview">
			<# if ( 'image' === data.attachment.type && data.attachment.sizes && data.attachment.sizes.medium ) { #>
				<img class="attachment-thumb" src="{{ data.attachment.sizes.medium.url }}" draggable="false" alt="" />
			<# } else if ( 'image' === data.attachment.type && data.attachment.sizes && data.attachment.sizes.full ) { #>
				<img class="attachment-thumb" src="{{ data.attachment.sizes.full.url }}" draggable="false" alt="" />
			<# } else if ( data.attachment.error && data.attachment.error.missing_attachment ) { #>
				<div class="notice notice-error notice-alt notice-missing-attachment">
					<p><?php echo $this->l10n['missing_attachment']; ?></p>
				</div>
			<# } #>
		</script>
		<?php
	}
}
