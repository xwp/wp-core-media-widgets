<?php

class Test_WP_Widget_Media extends WP_UnitTestCase {

	/**
	 * Get instance for mocked media widget class.
	 *
	 * @return PHPUnit_Framework_MockObject_MockObject|WP_Widget_Media Mocked instance.
	 */
	function get_mocked_class_instance() {
		$original_class_name = 'WP_Widget_Media';
		$arguments = array(
			'mocked',
			'Mocked',
		);
		$mock_class_name = 'WP_Widget_Media_Mocked';
		$call_original_constructor = true;
		$call_original_clone = true;
		$call_autoload = true;
		$mocked_methods = array( 'render_media' );

		$widget = $this->getMockForAbstractClass( $original_class_name, $arguments, $mock_class_name, $call_original_constructor, $call_original_clone, $call_autoload, $mocked_methods );

		return $widget;
	}

	/**
	 * @covers WP_Widget_Media::update()
	 */
	function test_update() {

		$widget = $this->get_mocked_class_instance();

		$instance = array();

		// Should return valid attachment ID.
		$expected = array( 'attachment_id' => 1 );
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment ID.
		$result = $widget->update( array( 'attachment_id' => 'media' ), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid attachment url.
		$expected = array( 'url' => 'https://example.org' );
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment url.
		$result = $widget->update( array( 'url' => 'not_a_url' ), $instance );
		$this->assertNotSame( $result, $instance );

		// Should return valid attachment title.
		$expected = array( 'title' => 'What a title' );
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment title.
		$result = $widget->update( array( 'title' => '<h1>W00t!</h1>' ), $instance );
		$this->assertNotSame( $result, $instance );

		// Should filter invalid key.
		$result = $widget->update( array( 'imaginary_key' => 'value' ), $instance );
		$this->assertSame( $result, $instance );

		$widget->render_media( array(), array() );
	}

	/**
	 * @covers WP_Widget_Media::widget()
	 */
	function test_widget() {
		$args = array(
			'before_title'  => '<h2>',
			'after_title'   => "</h2>\n",
			'before_widget' => '<section>',
			'after_widget'  => "</section>\n",
		);
		$instance = array(
			'title' => 'Foo',
			'url' => '',
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
		$widget = $this->get_mocked_class_instance();
		$instance['title'] = '';
		$widget->expects( $this->atLeastOnce() )->method( 'render_media' )->with( $instance );
		$widget->widget( $args, array() );
		$output = ob_get_clean();
		$this->assertNotContains( '<h2>Foo</h2>', $output );
	}

	/**
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
