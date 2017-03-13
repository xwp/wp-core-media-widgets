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
			'no_media_selected' => __( 'No image selected' ),
			'edit_media' => __( 'Edit Image' ),
			'change_media' => __( 'Change Image' ),
			'select_media' => __( 'Select Image' ),
		) );

		// @todo The following should be broken out into a schema that has the requisite types and sanitize_callbacks defined.
		$this->default_instance = array_merge(
			$this->default_instance,
			array(
				'attachment_id' => 0,
				'url' => '', // This should only be set in the instance if attachment_id is empty.

				'size' => 'full',
				'width' => 0, // Via 'customWidth', only when size=custom; otherwise via 'width'.
				'height' => 0, // Via 'customHeight', only when size=custom; otherwise via 'height'.

				'align' => '',
				'caption' => '',
				'alt' => '',

				'link_type' => 'none', // Via 'link' property.
				'link_url' => '', // Via 'linkUrl' property.

				'image_classes' => '', // Via 'extraClasses' property.
				'link_classes' => '', // Via 'linkClassName' property.
				'link_rel' => '', // Via 'linkRel' property.
				'link_target_blank' => false, // Via 'linkTargetBlank' property.
				'image_title' => '', // Via 'title' property.

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
		$instance = array_merge( $this->default_instance, $instance );
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
