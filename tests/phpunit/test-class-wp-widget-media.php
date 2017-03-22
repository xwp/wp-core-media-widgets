<?php
/**
 * Unit tests covering WP_Widget_Media functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Class Test_WP_Widget_Media
 */
class Test_WP_Widget_Media extends WP_UnitTestCase {

	/**
	 * Get instance for mocked media widget class.
	 *
	 * @param string $id_base         Base ID for the widget, lowercase and unique.
	 * @param string $name            Name for the widget displayed on the configuration page.
	 * @param array  $widget_options  Optional. Widget options.
	 * @param array  $control_options Optional. Widget control options.
	 * @return PHPUnit_Framework_MockObject_MockObject|WP_Widget_Media Mocked instance.
	 */
	function get_mocked_class_instance( $id_base = 'mocked', $name = 'Mocked', $widget_options = array(), $control_options = array() ) {
		$original_class_name       = 'WP_Widget_Media';
		$arguments                 = array( $id_base, $name, $widget_options, $control_options );
		$mock_class_name           = '';
		$call_original_constructor = true;
		$call_original_clone       = true;
		$call_autoload             = true;
		$mocked_methods            = array( 'render_media' );

		return $this->getMockForAbstractClass( $original_class_name, $arguments, $mock_class_name, $call_original_constructor, $call_original_clone, $call_autoload, $mocked_methods );
	}

	/**
	 * Test constructor.
	 *
	 * @covers WP_Widget_Media::__constructor()
	 */
	function test_constructor() {
		$widget = $this->get_mocked_class_instance();

		$this->assertArrayHasKey( 'mime_type', $widget->widget_options );
		$this->assertArrayHasKey( 'customize_selective_refresh', $widget->widget_options );
		$this->assertArrayHasKey( 'description', $widget->widget_options );
		$this->assertTrue( $widget->widget_options['customize_selective_refresh'] );
		$this->assertEmpty( $widget->widget_options['mime_type'] );
		$this->assertEqualSets( array(
			'add_to_widget',
			'change_media',
			'edit_media',
			'media_library_state',
			'missing_attachment',
			'no_media_selected',
			'select_media',
		), array_keys( $widget->l10n ) );
		$this->assertEquals( count( $widget->l10n ), count( array_filter( $widget->l10n ) ), 'Expected all translation strings to be defined.' );
		$this->assertEquals( 10, has_action( 'admin_enqueue_scripts', array( $widget, 'maybe_enqueue_admin_scripts' ) ) );
		$this->assertEquals( 10, has_action( 'admin_footer-widgets.php', array( $widget, 'maybe_print_control_templates' ) ) );
		$this->assertEquals( 10, has_action( 'customize_controls_print_footer_scripts', array( $widget, 'maybe_print_control_templates' ) ) );

		// With non-default args.
		$id_base         = 'media_pdf';
		$name            = 'PDF';
		$widget_options  = array(
			'mime_type' => 'application/pdf',
		);
		$control_options = array(
			'width'  => 850,
			'height' => 1100,
		);
		$widget          = $this->get_mocked_class_instance( $id_base, $name, $widget_options, $control_options );
		$this->assertEquals( $id_base, $widget->id_base );
		$this->assertEquals( $name, $widget->name );

		// Method assertArraySubset doesn't exist in phpunit versions compatible with PHP 5.2.
		if ( method_exists( $this, 'assertArraySubset' ) ) {
			$this->assertArraySubset( $widget_options, $widget->widget_options );
			$this->assertArraySubset( $control_options, $widget->control_options );
		}
	}

	/**
	 * Test update method.
	 *
	 * @covers WP_Widget_Media::update()
	 */
	function test_update() {
		$widget   = $this->get_mocked_class_instance();
		$instance = array();

		// Should return valid attachment ID.
		$expected = array(
			'attachment_id' => 1,
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment ID.
		$result = $widget->update(
			array(
				'attachment_id' => 'media',
			),
			$instance
		);
		$this->assertSame( $result, $instance );

		// Should return valid attachment url.
		$expected = array(
			'url' => 'https://example.org',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment url.
		$result = $widget->update(
			array(
				'url' => 'not_a_url',
			),
			$instance
		);
		$this->assertNotSame( $result, $instance );

		// Should return valid attachment title.
		$expected = array(
			'title' => 'What a title',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment title.
		$result = $widget->update(
			array(
				'title' => '<h1>W00t!</h1>',
			),
			$instance
		);
		$this->assertNotSame( $result, $instance );

		// Should filter invalid key.
		$result = $widget->update(
			array(
				'imaginary_key' => 'value',
			),
			$instance
		);
		$this->assertSame( $result, $instance );

		$widget->render_media( array(), array() );
	}

	/**
	 * Test widget method.
	 *
	 * @covers WP_Widget_Media::widget()
	 * @covers WP_Widget_Media::render_media()
	 */
	function test_widget() {
		$args     = array(
			'before_title'  => '<h2>',
			'after_title'   => "</h2>\n",
			'before_widget' => '<section>',
			'after_widget'  => "</section>\n",
		);
		$instance = array(
			'title'         => 'Foo',
			'url'           => '',
			'attachment_id' => 0,
		);

		ob_start();
		$widget = $this->get_mocked_class_instance();
		$widget->expects( $this->atLeastOnce() )->method( 'render_media' )->with( $instance );
		$widget->widget( $args, $instance );
		$output = ob_get_clean();

		$this->assertContains( '<h2>Foo</h2>', $output );
		$this->assertContains( '<section>', $output );
		$this->assertContains( '</section>', $output );

		// No title.
		ob_start();
		$widget            = $this->get_mocked_class_instance();
		$instance['title'] = '';
		$widget->expects( $this->atLeastOnce() )->method( 'render_media' )->with( $instance );
		$widget->widget( $args, array() );
		$output = ob_get_clean();
		$this->assertNotContains( '<h2>Foo</h2>', $output );
	}

	/**
	 * Test form method.
	 *
	 * @covers WP_Widget_Media::form()
	 */
	function test_form() {
		$this->markTestIncomplete();
	}

	/**
	 * Test maybe_enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Media::maybe_enqueue_admin_scripts()
	 */
	function test_maybe_enqueue_admin_scripts() {
		$this->markTestIncomplete();
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Media::enqueue_admin_scripts()
	 */
	function test_enqueue_admin_scripts() {
		$this->markTestIncomplete();
	}

	/**
	 * Test maybe_print_control_templates method.
	 *
	 * @covers WP_Widget_Media::maybe_print_control_templates()
	 */
	function test_maybe_print_control_templates() {
		$this->markTestIncomplete();
	}

	/**
	 * Test render_control_template_scripts method.
	 *
	 * @covers WP_Widget_Media::render_control_template_scripts
	 */
	function test_render_control_template_scripts() {
		$widget = $this->get_mocked_class_instance();

		ob_start();
		$widget->render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-widget-media-mocked-control">', $output );
	}
}
