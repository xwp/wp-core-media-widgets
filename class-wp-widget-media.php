<?php
/**
 * Widget API: WP_Media_Widget class
 *
 * @package WordPress
 * @subpackage Widgets
 * @since 4.8.0
 */

/**
 * Core class that implements a media widget.
 *
 * @since 4.8.0
 *
 * @see WP_Widget
 */
class WP_Media_Widget extends WP_Widget {
	/**
	 * Constructor.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param string $id_base         Optional Base ID for the widget, lowercase and unique. If left empty,
	 *                                a portion of the widget's class name will be used Has to be unique.
	 * @param string $name            Optional. Name for the widget displayed on the configuration page.
	 *                                Default empty.
	 * @param array  $widget_options  Optional. Widget options. See wp_register_sidebar_widget() for
	 *                                information on accepted arguments. Default empty array.
	 * @param array  $control_options Optional. Widget control options. See wp_register_widget_control()
	 *                                for information on accepted arguments. Default empty array.
	 */
	public function __construct( $id_base = '', $name = '', $widget_options = array(), $control_options = array() ) {
		$widget_opts = wp_parse_args( $widget_options, array(
			'classname' => 'widget_media',
			'description' => __( 'Display media such as images, video, or audio in your sidebar.' ),
			'customize_selective_refresh' => true,
		) );

		$control_opts = wp_parse_args( $control_options, array() );

		parent::__construct(
			$id_base ? $id_base : 'wp-media-widget',
			$name ? $name : __( 'Media' ),
			$widget_opts,
			$control_opts
		);

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Displays the widget on the front-end.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @see WP_Widget::widget()
	 *
	 * @param array $args     Display arguments including before_title, after_title, before_widget, and after_widget.
	 * @param array $instance Saved setting from the database.
	 */
	public function widget( $args, $instance ) {
		$output = $args['before_widget'];
		if ( ! empty( $instance['title'] ) ) {
			$title = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );
			$output .= $args['before_title'] . $title . $args['after_title'];
		}
		if ( ! empty( $instance['description'] ) ) {
			$output .= '<p class="attachment-description align' . $instance['align'] . '">' . $instance['description'] . '</p>';
		}
		if ( ! empty( $instance['link'] ) ) {
			if ( 'file' === $instance['link'] ) {
				$url = wp_get_attachment_url( $instance['id'] );
				$selectedLink = $url;
			} else if ( 'post' === $instance['link'] ) {
				$url = get_attachment_link( $instance['id'] );
				$selectedLink = $url;
			} else {
				$selectedLink = '';
			}
		}

		// Build the media output.
		$media_output = '';
		if ( ! empty( $selectedLink ) ) {
			$media_output .= '<a href="' . $selectedLink . '">';
		}

		if ( ! empty( $instance['id'] ) ) {
			if ( $attachment = get_post( $instance['id'] ) ) {
				$attrs = array();

				if ( ! empty( $instance['title'] ) ) {
					$attrs['title'] = $instance['title'];
				}

				// Image.
				if ( wp_attachment_is_image( $attachment ) ) {

					$media_output .= $this->get_attachment_image( $instance['id'], $instance['size'], array(
						'id'      => $args['widget_id'],
						'align'   => $instance['align'],
						'scale'   => $instance['scale'],
						'title'   => $attachment->post_title,
						'caption' => $attachment->post_excerpt,
					) );

				// Audio.
				} elseif ( wp_attachment_is( 'audio', $attachment ) ) {
					if ( ! empty( $selectedLink ) ) {
						$media_output .= $attachment->post_title;
					} else {
						$media_output .= $this->get_attachment_audio( $attachment->ID, array() );
					}

				// Video.
				} elseif ( wp_attachment_is( 'video', $attachment ) ) {
					if ( ! empty( $selectedLink ) ) {
						$media_output .= $attachment->post_title;
					} else {
						$media_output .= $this->get_attachment_video( $attachment->ID, array() );
					}
				}
			}
		}

		if ( ! empty( $selectedLink ) ) {
			$media_output .= '</a>';
		}

		$output .= $media_output;
		$output .= $this->get_responsive_style( $attachment, $args['widget_id'], $instance );
		$output .= $args['after_widget'];

		echo $output;
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
	 * @param array $old_instance Previously saved values from database.
	 * @return array Updated safe values to be saved.
	 */
	function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		// ID, title, scale
		$instance['id'] = (int) $new_instance['id'];
		$instance['title'] = sanitize_text_field( $new_instance['title'] );
		$instance['scale'] = isset( $new_instance['scale'] ) ? sanitize_text_field( $new_instance['scale'] ) : '';

		// Everything else.
		$instance['align'] = sanitize_text_field( $new_instance['align'] );
		$instance['size']  = sanitize_text_field( $new_instance['size'] );
		$instance['link']  = sanitize_text_field( $new_instance['link'] );

		return $instance;
	}

	/**
	 * Renders an image attachment preview.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param WP_Post $attachment Attachment object.
	 * @param string  $widget_id  Widget ID.
	 * @param array   $instance   Current widget instance arguments.
	 */
	public function render_image( $attachment, $widget_id, $instance ) {
		$attrs = array(
			'id'      => $widget_id,
			'align'   => $instance['align'],
			'title'   => $attachment->post_title,
			'caption' => $attachment->post_excerpt,
		);

		// If an image id is saved for this widget, display the image using `wp_get_attachment_image()`.
		$output =  '<div class="media-widget-admin-preview" id="' . $widget_id . '">';
		$output .= $this->get_attachment_image( $attachment->ID, $instance['size'], $attrs );
		$output .= '</div>';

		echo $output;
	}

	/**
	 * Get an elmeent reprensenting an image attachment
	 *
	 * @since 4.8.0
	 * @access private
	 *
	 * @param int    $attachment_id Image attachment ID.
	 * @param string $size  Image size. Default value: 'medium'
	 * @param array  $attrs Attributes for the markup.
	 */
	private function get_attachment_image( $attachment_id, $size = 'medium', $attrs = array() ) {

		$has_caption   = ( ! empty( $attrs['caption'] ) );
		$is_responsive = ( ! empty( $attrs['scale'] ) );

		$img_attrs = array(
			'data-id' => $attrs['id'],
			'title'   => $attrs['title'],
			'class'   => 'image wp-image-' . $attachment_id,
		);

		if ( $has_caption ) {
			$img_attrs['class'] .= ' align' . $attrs['align'];
		}

		if ( $is_responsive ) {
			$img_attrs['style'] = 'width: 100%; height: auto;';
		}

		$image = wp_get_attachment_image( $attachment_id, $size, false, $img_attrs );

		if ( ! $has_caption ) {
			return $image;
		}

		$attrs['id'] .= '-caption';
		$attrs['width'] = get_option( $size . '_size_w' );

		$figure = img_caption_shortcode( $attrs, $image );

		return $figure;
	}

	/**
	 * Renders an audio attachment preview.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param WP_Post $attachment Attachment object.
	 * @param string  $widget_id  Widget ID.
	 * @param array   $instance   Current widget instance arguments.
	 */
	public function render_audio( $attachment, $widget_id, $instance ) {
		$output = '<div class="media-widget-admin-preview" id="' . $widget_id . '">';;
		if ( 'embed' === $instance['link'] ) {
			$output .= $this->get_attachment_audio( $attachment->ID );
		} else {
			$output .= '<a href="#">' . $attachment->post_title .'</a>';
		}
		$output .= '</div>';

		echo $output;
	}

	/**
	 * Get an audio elmeent reprensenting a video attachment
	 *
	 * @since 4.8.0
	 * @access private
	 *
	 * @param int   $attachment_id Audio attachment ID.
	 * @param array Attributes for the audio markup.
	 */
	private function get_attachment_audio( $attachment_id, $attrs = array() ) {
		$output = wp_audio_shortcode( array(
			'src' => wp_get_attachment_url( $attachment_id )
		) );

		return $output;
	}

	/**
	 * Renders a video attachment preview.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param WP_Post $attachment Attachment object.
	 * @param string  $widget_id  Widget ID.
	 * @param array   $instance   Current widget instance arguments.
	 */
	public function render_video( $attachment, $widget_id, $instance ) {
		$output = '<div class="media-widget-admin-preview" id="' . $widget_id . '">';
		if ( 'embed' === $instance['link'] ) {
			$output .= $this->get_attachment_video( $attachment->ID );
		} else {
			$output .= '<a href="#">' . $attachment->post_title .'</a>';
		}
		$output .= '</div>';

		echo $output;
	}

	/**
	 * Get a video elmeent reprensenting a video attachment
	 *
	 * @since 4.8.0
	 * @access private
	 *
	 * @param int   $attachment_id Video attachment ID.
	 * @param array Attributes for the video markup.
	 */
	private function get_attachment_video( $attachment_id, $attrs = array() ) {
		$output = wp_video_shortcode( array(
			'src' => wp_get_attachment_url( $attachment_id )
		) );

		return $output;
	}

	/**
	 * Get styles for responsifying the widget
	 *
	 * @since 4.8.0
	 * @access private
	 *
	 * @param WP_Post $attachment Attachment object.
	 * @param string  $widget_id  Widget ID.
	 * @param array   $instance   Current widget instance arguments.
	 */
	private function get_responsive_style( $attachment, $widget_id, $instance ) {
		if ( empty( $instance['scale'] ) || wp_attachment_is( 'audio', $attachment ) ) {
			return;
		}

		$output = '<style type="text/css">';

		if ( wp_attachment_is_image( $attachment ) ) {
			$output .= "#{$widget_id}-caption{ width: 100% !important; }";
		}

		if ( wp_attachment_is( 'video', $attachment ) ) {
			$output .= "#{$widget_id} .wp-video{ width: 100% !important; }";
		}

		$output .= '</style>';

		return $output;
	}

	/**
	 * Outputs the settings update form.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param array $saved_instance Current settings.
	 * @return string Default return is 'noform'.
	 */
	public function form( $saved_instance ) {
		$defaults = array(
			'title'  => '',
			// Attachment props.
			'id'     => '',
			'align'  => '',
			'size'   => '',
			'link'   => '',
			'scale'  => '',
		);

		$instance   = wp_parse_args( (array) $saved_instance, $defaults );
		$attachment = empty( $instance['id'] ) ? null: get_post( $instance['id'] );
		$widget_id  = $this->id;
		?>
		<div class="<?php echo esc_attr( $widget_id ); ?> media-widget-preview">
			<p>
				<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:' ); ?></label>
				<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</p>

			<p>
				<?php esc_html_e( 'Add an image, video, or audio to your sidebar.' ); ?>
			</p>

			<?php
				if ( $attachment ) {
					if ( wp_attachment_is_image( $attachment ) ) {
						$this->render_image( $attachment, $widget_id, $instance );
					} elseif ( wp_attachment_is( 'audio', $attachment ) ) {
						$this->render_audio( $attachment, $widget_id, $instance );
					} elseif ( wp_attachment_is( 'video', $attachment ) ) {
						$this->render_video( $attachment, $widget_id, $instance );
					}
					echo $this->get_responsive_style( $attachment, $widget_id, $instance );
				}
			?>

			<p class="extras">
				<input
					type="checkbox"
					name="<?php echo $this->get_field_name( 'scale' ) ?>"
					id="<?php echo $this->get_field_id( 'scale' )?>"
					value="on"
					<?php checked( 'on', $instance[ 'scale' ]  ); ?>
				/>
				<label for="<?php echo $this->get_field_id( 'scale' )?>">
					<?php esc_html_e( 'Scale to fit width' ); ?>
				</label>
			</p>

			<p>
				<button data-id="<?php echo esc_attr( $widget_id ); ?>" class="button select-media widefat">
					<?php $attachment ? esc_html_e( 'Change Media' ) : esc_html_e( 'Select Media' ); ?>
				</button>
			</p>

			<?php
			// Use hidden form fields to capture the attachment details from the media manager.
			unset( $instance['title'], $instance['scale'] );
			?>

			<?php foreach ( $instance as $name => $value ) : ?>
				<input type="hidden" id="<?php echo esc_attr( $this->get_field_id( $name ) ); ?>" name="<?php echo esc_attr( $this->get_field_name( $name ) ); ?>" value="<?php echo esc_attr( $value ); ?>" />
			<?php endforeach; ?>
		</div>
		<?php
	}

	/**
	 * Registers the stylesheet for handling the widget in the back-end.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_styles() {
		wp_enqueue_style( 'wp-media-widget-styles' );
	}

	/**
	 * Registers the scripts for handling the widget in the back-end.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_scripts() {
		global $pagenow;

		// Bail if we are not in the widgets or customize screens.
		if ( ! ( 'widgets.php' == $pagenow || 'customize.php' == $pagenow ) ) {
			return;
		}

		// Load the required media files for the media manager.
		wp_enqueue_media();

		// Register, localize and enqueue custom JS.
		wp_enqueue_script( 'wp-media-widget' );

		wp_localize_script( 'wp-media-widget', '_mediaWidgetl10n',
			array(
				'title'  => __( 'Select an Image' ),
				'button' => __( 'Insert Image' ),
				'select-media'  => __( 'Select Media' ),
				'change-media'  => __( 'Change Media' ),
				'add-to-widget' => __( 'Add to widget' ),
			)
		);

		add_action( 'admin_print_footer_scripts', array( $this, 'admin_print_footer_scripts' ) );
	}

	/**
	 * Prints footer scripts.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function admin_print_footer_scripts() {
		?>
		<script type="text/html" id="tmpl-wp-media-widget-audio">
		<?php wp_underscore_audio_template() ?>
		</script>

		<script type="text/html" id="tmpl-wp-media-widget-video">
		<?php wp_underscore_video_template() ?>
		</script>

		<?php
	}
}
