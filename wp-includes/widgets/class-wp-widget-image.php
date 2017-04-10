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
			'select_media' => _x( 'Select Image', 'label for button in the image widget; should not be longer than ~13 characters long' ),
			'change_media' => _x( 'Change Image', 'label for button in the image widget; should not be longer than ~13 characters long' ),
			'edit_media' => _x( 'Edit Image', 'label for button in the image widget; should not be longer than ~13 characters long' ),
			'missing_attachment' => sprintf(
				/* translators: placeholder is URL to media library */
				__( 'We can&#8217;t find that image. Check your <a href="%s">media library</a> and make sure it wasn&#8217;t deleted.' ),
				esc_url( admin_url( 'upload.php' ) )
			),
			/* translators: %d is widget count */
			'media_library_state_multi' => _n_noop( 'Image Widget (%d)', 'Image Widget (%d)' ),
			'media_library_state_single' => __( 'Image Widget' ),
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
					'default' => 'medium',
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

				'caption' => array(
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => 'wp_kses_post',
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
					'sanitize_callback' => array( $this, 'sanitize_token_list' ),
				),
				'link_classes' => array( // Via 'linkClassName' property.
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => array( $this, 'sanitize_token_list' ),
				),
				'link_rel' => array( // Via 'linkRel' property.
					'type' => 'string',
					'default' => '',
					'sanitize_callback' => array( $this, 'sanitize_token_list' ),
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

		$attachment = null;
		if ( $instance['attachment_id'] ) {
			$attachment = get_post( $instance['attachment_id'] );
		}
		if ( $attachment && 'attachment' === $attachment->post_type ) {
			$caption = $attachment->post_excerpt;
			if ( $instance['caption'] ) {
				$caption = $instance['caption'];
			}

			$image_attributes = array(
				'title' => $instance['image_title'] ? $instance['image_title'] : get_the_title( $attachment->ID ),
				'class' => sprintf( 'image wp-image-%d %s', $attachment->ID, $instance['image_classes'] ),
				'style' => 'max-width: 100%; height: auto;',
			);

			if ( $instance['alt'] ) {
				$image_attributes['alt'] = $instance['alt'];
			}

			$size = $instance['size'];
			if ( 'custom' === $size || ! in_array( $size, array_merge( get_intermediate_image_sizes(), array( 'full' ) ), true ) ) {
				$size = array( $instance['width'], $instance['height'] );
			}

			$image = wp_get_attachment_image( $attachment->ID, $size, false, $image_attributes );

			$caption_size = _wp_get_image_size_from_meta( $instance['size'], wp_get_attachment_metadata( $attachment->ID ) );
			$width = empty( $caption_size[0] ) ? 0 : $caption_size[0];

		} else {
			if ( empty( $instance['url'] ) ) {
				return;
			}

			$instance['size'] = 'custom';
			$caption = $instance['caption'];
			$width   = $instance['width'];
			$classes = 'image ' . $instance['image_classes'];

			$image = sprintf( '<img class="%1$s" src="%2$s" alt="%3$s" width="%4$d" height="%5$d" />',
				esc_attr( $classes ),
				esc_url( $instance['url'] ),
				esc_attr( $instance['alt'] ),
				esc_attr( $instance['width'] ),
				esc_attr( $instance['height'] )
			);
		} // End if().

		$url = '';
		if ( 'file' === $instance['link_type'] ) {
			$url = $attachment ? wp_get_attachment_url( $attachment->ID ) : $instance['url'];
		} elseif ( $attachment && 'post' === $instance['link_type'] ) {
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
			$image = img_caption_shortcode( array(
				'width' => $width,
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
			<#
			var describedById = 'describedBy-' + String( Math.random() );
			#>
			<# if ( data.attachment.error && 'missing_attachment' === data.attachment.error ) { #>
				<div class="notice notice-error notice-alt notice-missing-attachment">
					<p><?php echo $this->l10n['missing_attachment']; ?></p>
				</div>
			<# } else if ( data.attachment.error ) { #>
				<div class="notice notice-error notice-alt">
					<p><?php _e( 'Unable to preview media due to an unknown error.' ); ?></p>
				</div>
			<# } else if ( data.attachment.url || data.url ) { #>
				<img class="attachment-thumb" src="{{ data.attachment.url || data.url }}" draggable="false" alt="{{ data.alt }}" <# if ( ! data.alt ) { #> aria-describedby="{{ describedById }}" <# } #> />
				<# if ( ! data.alt ) { #>
					<#
					var alt = ( data.attachment.url || data.url );
					alt = alt.replace( /\?.*$/, '' );
					alt = alt.replace( /^.+\//, '' );
					#>
					<p class="hidden" id="{{ describedById }}"><?php
						/* translators: placeholder is image filename */
						echo sprintf( __( 'Current image: %s' ), '{{ alt }}' );
					?></p>
				<# } #>
			<# } else { #>
				<div class="attachment-media-view">
					<p class="placeholder"><?php echo esc_html( $this->l10n['no_media_selected'] ); ?></p>
				</div>
			<# } #>
		</script>
		<?php
	}
}
