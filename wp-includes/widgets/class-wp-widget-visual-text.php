<?php
/**
 * Widget API: WP_Widget_Visual_Text class
 *
 * @package WordPress
 * @subpackage Widgets
 * @since 4.8.0
 */

/**
 * Core class used to implement a Text widget.
 *
 * @since 4.8.0
 *
 * @see WP_Widget
 */
class WP_Widget_Visual_Text extends WP_Widget_Text {

	/**
	 * Sets up a new Text widget instance.
	 *
	 * @since 2.8.0
	 * @access public
	 */
	public function __construct() {
		parent::__construct();
		$this->name = __( 'Visual Text' );
	}

	/**
	 * Add hoosk for enqueueing assets when registering all widget instances of this widget class.
	 *
	 * @since 2.8.0
	 * @access public
	 */
	public function _register() {
		add_action( 'admin_print_scripts-widgets.php', array( $this, 'enqueue_admin_scripts' ) );
		add_action( 'customize_controls_print_scripts', array( $this, 'enqueue_admin_scripts' ) );

		parent::_register();
	}

	/**
	 * Outputs the content for the current Text widget instance.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param array $args     Display arguments including 'before_title', 'after_title',
	 *                        'before_widget', and 'after_widget'.
	 * @param array $instance Settings for the current Text widget instance.
	 */
	public function widget( $args, $instance ) {

		/** This filter is documented in wp-includes/widgets/class-wp-widget-pages.php */
		$title = apply_filters( 'widget_title', empty( $instance['title'] ) ? '' : $instance['title'], $instance, $this->id_base );

		$widget_text = ! empty( $instance['text'] ) ? $instance['text'] : '';

		/**
		 * Filters the content of the Text widget.
		 *
		 * @since 2.3.0
		 * @since 4.4.0 Added the `$this` parameter.
		 *
		 * @param string         $widget_text The widget content.
		 * @param array          $instance    Array of settings for the current widget.
		 * @param WP_Widget_Text $this        Current Text widget instance.
		 */
		$text = apply_filters( 'widget_text', $widget_text, $instance, $this );

		echo $args['before_widget'];
		if ( ! empty( $title ) ) {
			echo $args['before_title'] . $title . $args['after_title'];
		}

		if ( ! isset( $instance['filter'] ) || true === $instance['filter'] ) {
			$text = wpautop( $text );
		}

		// @todo Figure out which of the_content filters can be applied since there is no post global here.
		$text = wptexturize( $text );

		?>
			<div class="textwidget"><?php echo $text; ?></div>
		<?php
		echo $args['after_widget'];
	}

	/**
	 * Handles updating settings for the current Text widget instance.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param array $new_instance New settings for this instance as input by the user via
	 *                            WP_Widget::form().
	 * @param array $old_instance Old settings for this instance.
	 * @return array Settings to save or bool false to cancel saving.
	 */
	public function update( $new_instance, $old_instance ) {
		$instance = $old_instance;
		$instance['title'] = sanitize_text_field( $new_instance['title'] );
		if ( current_user_can( 'unfiltered_html' ) ) {
			$instance['text'] = $new_instance['text'];
		} else {
			$instance['text'] = wp_kses_post( $new_instance['text'] );
		}

		// Eliminate filter from here on.
		unset( $instance['filter'] );

		return $instance;
	}

	/**
	 * Loads the required scripts and styles for the widget control.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_scripts() {
		wp_enqueue_editor();
		wp_enqueue_script( 'text-widgets' );
	}

	/**
	 * Outputs the Text widget settings form.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param array $instance Current settings.
	 * @return void
	 */
	public function form( $instance ) {
		$instance = wp_parse_args(
			(array) $instance,
			array(
				'title' => '',
				'text' => '',
			)
		);

		if ( ! empty( $instance['filter'] ) ) {
			$instance['text'] = wpautop( $instance['text'] );
		}

		$title = sanitize_text_field( $instance['title'] );
		?>
		<p>
			<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php _e( 'Title:' ); ?></label>
			<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $title ); ?>" />
		</p>

		<p>
			<label for="<?php echo $this->get_field_id( 'text' ); ?>" class="screen-reader-text"><?php _e( 'Content:' ); ?></label>
			<textarea class="widefat" rows="16" cols="20" id="<?php echo $this->get_field_id( 'text' ); ?>" name="<?php echo $this->get_field_name( 'text' ); ?>"><?php echo esc_textarea( $instance['text'] ); ?></textarea>
		</p>
		<?php
	}
}
