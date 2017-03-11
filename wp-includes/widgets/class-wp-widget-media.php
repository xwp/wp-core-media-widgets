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
	 * @todo These are media-specific.
	 * @var array
	 */
	protected $default_instance = array(
		'id' => '', // @todo Rename this to attachment_id?
		'align' => 'none',
		'link' => '',
		'link_url' => '',
		'size' => '',
		'title' => '',
	);

	/**
	 * Constructor.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param string $id_base         Base ID for the widget, lowercase and unique.
	 * @param string $name            Name for the widget displayed on the configuration page.
	 * @param array  $widget_options  Optional. Widget options. See wp_register_sidebar_widget() for
	 *                                information on accepted arguments. Default empty array.
	 * @param array  $control_options Optional. Widget control options. See wp_register_widget_control()
	 *                                for information on accepted arguments. Default empty array.
	 */
	public function __construct( $id_base, $name, $widget_options = array(), $control_options = array() ) {
		$widget_opts = wp_parse_args( $widget_options, array(
			'description' => __( 'An image, video, or audio file.' ),
			'customize_selective_refresh' => true,
		) );

		$control_opts = wp_parse_args( $control_options, array() );

		parent::__construct(
			$id_base,
			$name,
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
		$instance = wp_parse_args( $instance, $this->default_instance );

		echo $args['before_widget'];

		if ( $instance['title'] ) {

			/** This filter is documented in wp-includes/widgets/class-wp-widget-pages.php */
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
	 * @param array $instance     Previously saved values from database.
	 * @return array Updated safe values to be saved.
	 */
	public function update( $new_instance, $instance ) {

		// ID and title.
		$instance['id']    = (int) $new_instance['id'];
		$instance['title'] = sanitize_text_field( $new_instance['title'] );

		if ( in_array( $new_instance['align'], array( 'none', 'left', 'right', 'center' ), true ) ) {
			$instance['align'] = $new_instance['align'];
		}

		$image_sizes = array_merge( get_intermediate_image_sizes(), array( 'full' ) );
		if ( in_array( $new_instance['size'], $image_sizes, true ) ) {
			$instance['size'] = $new_instance['size'];
		}

		$instance['link']  = esc_url_raw( $new_instance['link'] );

		$instance['link_url']  = esc_url_raw( $new_instance['link_url'] );

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

		return '<a href="' . esc_url( $url ) . '">' . get_the_title( $attachment->ID ) . '</a>';
	}

	/**
	 * Outputs the settings update form.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @todo This is redundant with JS-based templating. It should be made DRY by only using the JS template alone, with instance data stored in hidden named field.
	 * @param array $instance Current settings.
	 * @return void
	 */
	public function form( $instance ) {
		$instance = wp_parse_args( (array) $instance, $this->default_instance );
		$attachment = empty( $instance['id'] ) ? null : get_post( $instance['id'] );
		$widget_id = $this->id;
		?>
		<div class="<?php echo esc_attr( $widget_id ); ?> media-widget-preview <?php echo $attachment ? 'has-attachment' : '' ?>">
			<p>
				<label for="<?php echo $this->get_field_id( 'title' ); ?>"><?php esc_html_e( 'Title:' ); ?></label>
				<input class="widefat" id="<?php echo $this->get_field_id( 'title' ); ?>" name="<?php echo $this->get_field_name( 'title' ); ?>" type="text" value="<?php echo esc_attr( $instance['title'] ); ?>" />
			</p>

			<div class="media-widget-admin-preview" id="<?php echo esc_attr( $widget_id ); ?>">
				<?php if ( $attachment ) : ?>
					<?php
					$this->render_media(
						$attachment,
						$widget_id,
						array_merge(
							$instance,
							array(
								'align' => 'none', // Required to prevent widget control layout from breaking.
							)
						)
					);
					?>
				<?php else : ?>
					<p class="placeholder"><?php esc_html_e( 'No media selected' ); // @todo Use type-specific label. ?></p>
				<?php endif; ?>
			</div>

			<p class="media-widget-buttons">
				<button
					type="button"
					class="button edit-media"
					data-id="<?php echo esc_attr( $widget_id ); ?>"
					data-type="<?php echo esc_attr( $this->widget_options['mime_type'] ); ?>"
				>
					<?php esc_html_e( 'Edit Media' ); ?>
				</button>
				<button
					type="button"
					class="button select-media"
					data-id="<?php echo esc_attr( $widget_id ); ?>"
					data-type="<?php echo esc_attr( $this->widget_options['mime_type'] ); ?>"
				>
					<?php if ( $attachment ) : ?>
						<?php esc_html_e( 'Change Media' ); // @todo Use type-specific label. ?>
					<?php else : ?>
						<?php esc_html_e( 'Select Media' ); // @todo Use type-specific label. ?>
					<?php endif; ?>
				</button>
			</p>
			<?php
			// Use hidden form fields to capture the attachment details from the media manager.
			unset( $instance['title'] );
			?>

			<?php foreach ( $instance as $name => $value ) : ?>
				<input type="hidden" id="<?php echo esc_attr( $this->get_field_id( $name ) ); ?>" class="<?php echo esc_attr( $name ); ?>" name="<?php echo esc_attr( $this->get_field_name( $name ) ); ?>" value="<?php echo esc_attr( $value ); ?>" />
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
