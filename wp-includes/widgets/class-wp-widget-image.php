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

		$this->labels = array(
			'no_media_selected' => __( 'No image selected' ),
			'edit_media' => __( 'Edit Image' ),
			'change_media' => __( 'Change Image' ),
			'select_media' => __( 'Select Image' ),
		);

		// @todo The following should be broken out into a schema that has the requisite types and sanitize_callbacks defined.
		$this->default_instance = array_merge(
			$this->default_instance,
			array(
				'attachment_id' => 0,
				'url' => '', // This should only be set in the instance if attachment_id is empty.

				'size' => 'full',
				'width' => 0, // Via 'customWidth', only when size=custom.
				'height' => 0, // Via 'customHeight', only when size=custom.

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

		$image_sizes = array_merge( get_intermediate_image_sizes(), array( 'full' ) );
		if ( in_array( $new_instance['size'], $image_sizes, true ) ) {
			$instance['size'] = $new_instance['size'];
		}

		if ( in_array( $new_instance['link'], array( 'none', 'file', 'post', 'custom' ), true ) ) {
			$instance['link'] = $new_instance['link'];
		}

		$instance['link_url'] = esc_url_raw( $new_instance['link_url'] );

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

		$has_caption = ! empty( $attachment->post_excerpt );

		$image_attributes = array(
			'title'   => $attachment->post_title,
			'class'   => 'image wp-image-' . $attachment->ID,
			'style'   => 'max-width: 100%; height: auto;',
		);

		if ( ! $has_caption ) {
			$image_attributes['class'] .= ' align' . $instance['align'];
		}

		$image = wp_get_attachment_image( $attachment->ID, $instance['size'], false, $image_attributes );
		$url = '';
		if ( 'file' === $instance['link'] ) {
			$url = wp_get_attachment_url( $attachment->ID );
		} elseif ( 'post' === $instance['link'] ) {
			$url = get_attachment_link( $attachment->ID );
		} elseif ( 'custom' === $instance['link'] && ! empty( $instance['link_url'] ) ) {
			$url = $instance['link_url'];
		}

		if ( $url ) {
			$image = sprintf( '<a href="%s">%s</a>', esc_url( $url ), $image );
		}

		if ( $has_caption ) {
			$width = 0;
			$size = _wp_get_image_size_from_meta( $instance['size'], wp_get_attachment_metadata( $attachment->ID ) );
			if ( false !== $size ) {
				$width = $size[0];
			}
			$image = img_caption_shortcode( array(
				'width' => $width,
				'align' => 'align' . $instance['align'],
				'caption' => $attachment->post_excerpt,
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
