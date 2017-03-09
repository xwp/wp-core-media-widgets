<?php
/**
 * Widget API: WP_Widget_Video class
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
class WP_Widget_Video extends WP_Widget_Media {

	/**
	 * Constructor.
	 *
	 * @since  4.8.0
	 * @access public
	 */
	public function __construct() {
		parent::__construct( 'wp-video', __( 'Video' ), array(
			'classname'   => 'widget_wp-video',
			'description' => __( 'Displays a video file.' ),
			'mime_type'   => 'video',
		) );

		if ( $this->is_preview() ) {
			$this->enqueue_mediaelement_script();
		}

		add_action( 'admin_print_footer_scripts', array( $this, 'admin_print_footer_scripts' ) );
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
		if ( in_array( $instance['link'], array( 'file', 'post' ), true ) ) {
			echo $this->create_link_for( $attachment, $instance['link'] );
		} else {
			echo wp_video_shortcode( array(
				'src' => wp_get_attachment_url( $attachment->ID ),
			) );
		}
	}

	/**
	 * Prints footer scripts.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function admin_print_footer_scripts() {
		?>
		<script type="text/html" id="tmpl-wp-media-widget-video">
			<?php wp_underscore_video_template() ?>
		</script>
		<?php
	}

	/**
	 * Enqueue media element script and style if in need.
	 *
	 * This ensures the first instance of the video widget can properly handle video elements.
	 *
	 * @since 4.8.0
	 * @access private
	 */
	private function enqueue_mediaelement_script() {
		/** This filter is documented in wp-includes/media.php */
		if ( 'mediaelement' === apply_filters( 'wp_video_shortcode_library', 'mediaelement' ) ) {
			wp_enqueue_style( 'wp-mediaelement' );
			wp_enqueue_script( 'wp-mediaelement' );
		}
	}
}
