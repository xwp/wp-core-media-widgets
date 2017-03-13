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
	 * @todo The fields in this should be expanded out into full schema entries, with types and sanitize_callbacks.
	 * @var array
	 */
	protected $default_instance = array(
		'attachment_id' => 0,
	);

	/**
	 * Translation labels.
	 *
	 * @since 4.8.0
	 * @var array
	 */
	public $labels = array(
		'no_media_selected' => '',
		'edit_media' => '',
		'change_media' => '',
		'select_media' => '',
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
			'mime_type' => '',
		) );

		$control_opts = wp_parse_args( $control_options, array() );

		$default_labels = array(
			'no_media_selected' => __( 'No media selected' ),
			'edit_media' => __( 'Edit Media' ),
			'change_media' => __( 'Change Media' ),
			'select_media' => __( 'Select Media' ),
			'add_to_widget' => __( 'Add to Widget' ),
		);
		$this->labels = array_merge( $default_labels, array_filter( $this->labels ) );

		parent::__construct(
			$id_base,
			$name,
			$widget_opts,
			$control_opts
		);

		add_action( 'admin_enqueue_scripts', array( $this, 'maybe_enqueue_admin_scripts' ) );
		add_action( 'admin_footer-widgets.php', array( $this, 'maybe_print_control_templates' ) );
		add_action( 'customize_controls_print_footer_scripts', array( $this, 'maybe_print_control_templates' ) );
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

		$this->render_media( $instance );

		echo $args['after_widget'];
	}

	/**
	 * Sanitizes the widget form values as they are saved.
	 *
	 * @todo This method could read from an instance property schema definitions to apply sanitize callbacks.
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

		$instance['attachment_id'] = (int) $new_instance['attachment_id'];
		$instance['title'] = sanitize_text_field( $new_instance['title'] );

		return $instance;
	}

	/**
	 * Render the media on the frontend.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param array $instance Widget instance props.
	 * @return string
	 */
	abstract public function render_media( $instance );

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
	 * Note that the widget UI itself is rendered with JavaScript.
	 *
	 * @since 4.8.0
	 * @access public
	 *
	 * @param array $instance Current settings.
	 * @return void
	 */
	public function form( $instance ) {
		$instance = wp_array_slice_assoc(
			wp_parse_args( (array) $instance, $this->default_instance ),
			array_keys( $this->default_instance )
		);
		?>
		<?php foreach ( $instance as $name => $value ) : ?>
			<input
				type="hidden"
				data-property="<?php echo esc_attr( $name ); ?>"
				class="media-widget-instance-property"
				name="<?php echo esc_attr( $this->get_field_name( $name ) ); ?>"
				value="<?php echo esc_attr( wp_json_encode( $value ) ); ?>"
			/>
		<?php endforeach; ?>
		<?php
	}

	/**
	 * Check if is admin and if so call method to register scripts.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	final public function maybe_enqueue_admin_scripts() {
		if ( 'widgets.php' === $GLOBALS['pagenow'] || 'customize.php' === $GLOBALS['pagenow'] ) {
			$this->enqueue_admin_scripts();
		}
	}

	/**
	 * Loads the required media files for the media manager and scripts for .
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function enqueue_admin_scripts() {
		wp_enqueue_media();
		wp_enqueue_style( 'media-widgets' );
		wp_enqueue_script( 'media-widgets' );

		wp_add_inline_script(
			'media-widgets',
			sprintf(
				'wp.mediaWidgets.modelConstructors[ %s ].prototype.defaults = %s;',
				wp_json_encode( $this->id_base ),
				wp_json_encode( $this->default_instance )
			)
		);

		wp_add_inline_script(
			'media-widgets',
			sprintf(
				'wp.mediaWidgets.controlConstructors[ %s ].prototype.mime_type = %s;',
				wp_json_encode( $this->id_base ),
				wp_json_encode( $this->widget_options['mime_type'] )
			)
		);
	}

	/**
	 * Check if is admin and if so call method to register scripts.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	final public function maybe_print_control_templates() {
		if ( 'widgets.php' === $GLOBALS['pagenow'] || 'customize.php' === $GLOBALS['pagenow'] ) {
			$this->render_control_template_scripts();
		}
	}

	/**
	 * Render form template scripts.
	 *
	 * @since 4.8.0
	 * @access public
	 */
	public function render_control_template_scripts() {
		?>
		<script type="text/html" id="tmpl-widget-media-<?php echo $this->id_base; ?>-control">
			<# var elementIdPrefix = 'el' + String( Math.random() ) + '-' #>
			<p>
				<label for="{{ elementIdPrefix }}title"><?php esc_html_e( 'Title:' ); ?></label>
				<input id="{{ elementIdPrefix }}title" type="text" class="widefat">
			</p>
			<div class="media-widget-preview">
				<div class="selected rendered">
					<!-- Media rendering goes here. -->
				</div>
				<div class="not-selected">
					<p class="placeholder"><?php echo esc_html( $this->labels['no_media_selected'] ); ?></p>
				</div>
			</div>
			<p class="media-widget-buttons">
				<button type="button" class="button edit-media select-media selected">
					<?php echo esc_html( $this->labels['edit_media'] ); ?>
				</button>
				<button type="button" class="button change-media select-media selected">
					<?php echo esc_html( $this->labels['change_media'] ); ?>
				</button>
				<button type="button" class="button select-media not-selected">
					<?php echo esc_html( $this->labels['select_media'] ); ?>
				</button>
			</p>
		</script>
		<?php
	}
}
