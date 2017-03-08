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
abstract class WP_Widget_Media extends WP_Widget {

	/**
	 * Default instance.
	 *
	 * @var array
	 */
	protected $default_instance = array(
		'id'          => '',
		'title'       => '',
		'link'        => '',
		'align'       => 'none',
	);

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
			'description' => __( 'An image, video, or audio file.' ),
			'customize_selective_refresh' => true,
		) );

		$control_opts = wp_parse_args( $control_options, array() );

		parent::__construct(
			$id_base ? $id_base : 'wp-media-widget', // @todo This should just be 'media'.
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
		$instance = array_merge( $this->default_instance, $instance );

		echo $args['before_widget'];

		if ( $instance['title'] ) {
			$title = apply_filters( 'widget_title', $instance['title'], $instance, $this->id_base );
			echo $args['before_title'] . $title . $args['after_title'];
		}

		// Render the media.
		$attachment = $instance['id'] ? get_post( $instance['id'] ) : null;
		if ( $attachment ) {
			$this->render_media( $attachment, $args['widget_id'], $instance );
		}

		echo $args['after_widget'];
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
	public function update( $new_instance, $old_instance ) {
		$instance = $old_instance;

		// ID and title.
		$instance['id']    = (int) $new_instance['id'];
		$instance['title'] = sanitize_text_field( $new_instance['title'] );

		// Everything else.
		$instance['align'] = sanitize_text_field( $new_instance['align'] );
		$instance['size']  = sanitize_text_field( $new_instance['size'] );
		$instance['link']  = sanitize_text_field( $new_instance['link'] );

		return $instance;
	}

	/**
	 * Renders a single media attachment
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param WP_Post $attachment Attachment object.
	 * @param string  $widget_id  Widget ID.
	 * @param array   $instance   Current widget instance arguments.
	 * @return string
	 */
	abstract public function render_media( $attachment, $widget_id, $instance );

	/**
	 * Creates and returns a link for an attachment.
	 *
	 * @param WP_Post $attachment Attachment object.
	 * @param string  $type       link type.
	 * @return string
	 */
	protected function create_link_for( $attachment, $type = '' ) {
		$url = '#';
		if ( 'file' === $type ) {
			$url = wp_get_attachment_url( $attachment->ID );
		} elseif ( 'post' === $type ) {
			$url = get_attachment_link( $attachment->ID );
		}

		return '<a href="' . esc_url( $url ) . '">' . $attachment->post_title . '</a>';
	}

	/**
	 * Outputs the settings update form.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param array $saved_instance Current settings.
	 * @return void
	 */
	public function form( $saved_instance ) {
		$defaults = array(
			'title'  => '',
			// Attachment props.
			'id'     => '',
			'align'  => '',
			'size'   => '',
			'link'   => '',
		);

		$instance   = wp_parse_args( (array) $saved_instance, $defaults );
		$attachment = empty( $instance['id'] ) ? null : get_post( $instance['id'] );
		$widget_id  = $this->id;
		?>
		<div class="<?php echo esc_attr( $widget_id ); ?> media-widget-preview">
			<p>
				<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:' ); ?></label>
				<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</p>

			<div class="media-widget-admin-preview" id="<?php echo esc_attr( $widget_id ); ?>">
			<?php
			if ( $attachment ) :
				$this->render_media( $attachment, $widget_id, $instance );
				else :
					echo '<p class="placeholder">' . esc_html__( 'No media selected' ) . '</p>';
				endif;
			?>
			</div>

			<p>
				<button
					type="button"
					class="button select-media widefat"
					data-id="<?php echo esc_attr( $widget_id ); ?>"
					data-type="<?php echo esc_attr( $this->id_base ); ?>"
				>
					<?php $attachment ? esc_html_e( 'Change Media' ) : esc_html_e( 'Select Media' ); ?>
				</button>
			</p>

			<?php
			// Use hidden form fields to capture the attachment details from the media manager.
			unset( $instance['title'] );
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
		wp_enqueue_style( 'wp-media-widget' );
	}

	/**
	 * Loads the required media files for the media manager.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_scripts() {
		if ( 'widgets.php' === $GLOBALS['pagenow'] || $this->is_preview() ) {
			wp_enqueue_media();
			wp_enqueue_script( 'wp-media-widget' );
		}
	}
}
