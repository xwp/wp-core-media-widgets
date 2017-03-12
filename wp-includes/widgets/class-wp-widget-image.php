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
	 * Renders a single media attachment
	 *
	 * @since  4.8.0
	 * @access public
	 *
	 * @param WP_Post $attachment Attachment object.
	 * @param string  $widget_id  Widget ID.
	 * @param array   $instance   Current widget instance arguments.
	 *
	 * @return void
	 */
	public function render_media( $attachment, $widget_id, $instance ) {
		$instance = wp_parse_args( $instance, array(
			'size' => 'thumbnail',
		) );
		$has_caption = ! empty( $attachment->post_excerpt );

		$image_attributes = array(
			'data-id' => $widget_id,
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
				'id'      => $widget_id . '-caption',
				'width'   => $width,
				'align'   => 'align' . $instance['align'],
				'caption' => $attachment->post_excerpt,
			), $image );
		}

		echo $image;
	}
}
