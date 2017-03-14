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
				'attachment_id' => array(
					'type' => 'integer',
					'default' => 0,
				),
				'url' => array(
					'type' => 'string',
					'default' => '',
				),
				'size' => array(
					'type' => 'string', // @todo enum.
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
					'type' => 'string', // @todo enum.
					'default' => '',
				),
				'caption' => array(
					'type' => 'string',
					'default' => '',
				),
				'alt' => array(
					'type' => 'string',
					'default' => '',
				),
				'link_type' => array( // Via 'link' property.
					'type' => 'string', // @todo enum.
					'default' => 'none',
				),
				'link_url' => array( // Via 'linkUrl' property.
					'type' => 'string',
					'default' => '',
				),
				'image_classes' => array( // Via 'extraClasses' property.
					'type' => 'string',
					'default' => '',
				),
				'link_classes' => array( // Via 'linkClassName' property.
					'type' => 'string',
					'default' => '',
				),
				'link_rel' => array( // Via 'linkRel' property.
					'type' => 'string',
					'default' => '',
				),
				'link_target_blank' => array( // Via 'linkTargetBlank' property.
					'type' => 'boolean',
					'default' => false,
				),
				'image_title' => array( // Via 'title' property.
					'type' => 'string',
					'default' => '',
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
			'no_media_selected' => __( 'No image selected' ),
			'edit_media' => __( 'Edit Image' ),
			'change_media' => __( 'Change Image' ),
			'select_media' => __( 'Select Image' ),
		) );
	}

	/**
	 * Sanitizes the widget form values as they are saved.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @see WP_Widget::update()
	 *
	 * @param array $new_instance Values just sent to be saved.
	 * @param array $instance Previously saved values from database.
	 * @return array Updated safe values to be saved.
	 */
	public function update( $new_instance, $instance ) {
		$instance = parent::update( $new_instance, $instance );

		if ( in_array( $new_instance['align'], array( 'none', 'left', 'right', 'center' ), true ) ) {
			$instance['align'] = $new_instance['align'];
		}

		$image_sizes = array_merge( get_intermediate_image_sizes(), array( 'full', 'custom' ) );
		if ( in_array( $new_instance['size'], $image_sizes, true ) ) {
			$instance['size'] = $new_instance['size'];
		}

		$instance['width'] = intval( $new_instance['width'] );
		$instance['height'] = intval( $new_instance['height'] );

		if ( in_array( $new_instance['link_type'], array( 'none', 'file', 'post', 'custom' ), true ) ) {
			$instance['link_type'] = $new_instance['link_type'];
		}

		$instance['link_url'] = esc_url_raw( $new_instance['link_url'] );

		$instance['caption'] = sanitize_text_field( $new_instance['caption'] );
		$instance['alt'] = sanitize_text_field( $new_instance['alt'] );

		$instance['image_classes'] = sanitize_text_field( $new_instance['image_classes'] );
		$instance['link_classes'] = sanitize_text_field( $new_instance['link_classes'] );
		$instance['link_rel'] = sanitize_text_field( $new_instance['link_rel'] );
		$instance['image_title'] = sanitize_text_field( $new_instance['image_title'] );
		$instance['link_target_blank'] = (bool) $new_instance['link_target_blank'];

		return $instance;
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
		if ( 'custom' === $size || ! has_image_size( $size ) ) {
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

		wp_add_inline_script(
			$handle,
			sprintf(
				'wp.mediaWidgets.modelConstructors[ %s ].prototype.defaults = %s;',
				wp_json_encode( $this->id_base ),
				wp_json_encode( wp_list_pluck( $this->get_instance_schema(), 'default' ) )
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
			<# } #>
		</script>
		<?php
	}
}
