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
	 * Translation labels.
	 *
	 * @since 4.8.0
	 * @var array
	 */
	public $l10n = array(
		'no_media_selected' => '',
		'edit_media' => '',
		'change_media' => '',
		'select_media' => '',
		'add_to_widget' => '',
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

		$l10n_defaults = array(
			'no_media_selected' => __( 'No media selected' ),
			'edit_media' => __( 'Edit Media' ),
			'change_media' => __( 'Change Media' ),
			'select_media' => __( 'Select Media' ),
			'add_to_widget' => __( 'Add to Widget' ),
		);
		$this->l10n = array_merge( $l10n_defaults, array_filter( $this->l10n ) );

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
	 * Get instance schema.
	 *
	 * This is protected because it may become part of WP_Widget eventually.
	 *
	 * @link https://core.trac.wordpress.org/ticket/35574
	 * @return array
	 */
	protected function get_instance_schema() {
		return array(
			'attachment_id' => array(
				'type' => 'integer',
				'default' => 0,
				'minimum' => 0,
			),
			'url' => array(
				'type' => 'string',
				'default' => '',
				'format' => 'uri',
			),
			'title' => array(
				'type' => 'string',
				'default' => '',
				'sanitize_callback' => 'sanitize_text_field',
			),
		);
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
		$instance = wp_parse_args( $instance, wp_list_pluck( $this->get_instance_schema(), 'default' ) );

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
	 * @see WP_REST_Request::has_valid_params()
	 * @see WP_REST_Request::sanitize_params()
	 *
	 * @param array $new_instance Values just sent to be saved.
	 * @param array $instance     Previously saved values from database.
	 * @return array Updated safe values to be saved.
	 */
	public function update( $new_instance, $instance ) {

		$schema = $this->get_instance_schema();
		foreach ( $schema as $field => $field_schema ) {
			if ( ! array_key_exists( $field, $new_instance ) ) {
				continue;
			}
			$value = $new_instance[ $field ];
			if ( true !== rest_validate_value_from_schema( $value, $field_schema, $field ) ) {
				continue;
			}
			$value = rest_sanitize_value_from_schema( $value, $field_schema );
			if ( is_wp_error( $value ) ) {
				continue;
			}
			if ( isset( $field_schema['sanitize_callback'] ) ) {
				$value = call_user_func( $field_schema['sanitize_callback'], $value );
			}
			if ( is_wp_error( $value ) ) {
				continue;
			}
			$instance[ $field ] = $value;
		}

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
		$instance_schema = $this->get_instance_schema();
		$instance = wp_array_slice_assoc(
			wp_parse_args( (array) $instance, wp_list_pluck( $instance_schema, 'default' ) ),
			array_keys( wp_list_pluck( $instance_schema, 'default' ) )
		);
		?>
		<?php foreach ( $instance as $name => $value ) : ?>
			<input
				type="hidden"
				data-property="<?php echo esc_attr( $name ); ?>"
				class="media-widget-instance-property"
				name="<?php echo esc_attr( $this->get_field_name( $name ) ); ?>"
				id="<?php echo esc_attr( $this->get_field_id( $name ) ); // Needed specifically by wpWidgets.appendTitle(). ?>"
				value="<?php echo esc_attr( strval( $value ) ); ?>"
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
			<# var elementIdPrefix = 'el' + String( Math.random() ) + '_' #>
			<p>
				<label for="{{ elementIdPrefix }}title"><?php esc_html_e( 'Title:' ); ?></label>
				<input id="{{ elementIdPrefix }}title" type="text" class="widefat title">
			</p>
			<div class="media-widget-preview">
				<div class="selected rendered">
					<!-- Media rendering goes here. -->
				</div>
				<div class="not-selected">
					<p class="placeholder"><?php echo esc_html( $this->l10n['no_media_selected'] ); ?></p>
				</div>
			</div>
			<p class="media-widget-buttons">
				<button type="button" class="button edit-media selected">
					<?php echo esc_html( $this->l10n['edit_media'] ); ?>
				</button>
				<button type="button" class="button change-media select-media selected">
					<?php echo esc_html( $this->l10n['change_media'] ); ?>
				</button>
				<button type="button" class="button select-media not-selected">
					<?php echo esc_html( $this->l10n['select_media'] ); ?>
				</button>
			</p>
		</script>
		<?php
	}
}
