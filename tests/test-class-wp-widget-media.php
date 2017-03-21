<?php

class Test_WP_Media_Widget extends WP_UnitTestCase {

	/**
	 * @covers WP_Widget_Media::update
	 */
	function test_update() {
		$widget = new Test_Media_Widget( 'media', 'Media' );
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
	}

	/**
	 * @covers WP_Widget_Media::widget
	 */
	function test_widget() {
		$widget = new Test_Media_Widget( 'media', 'Media' );

		$args = array(
			'before_title'  => '<h2>',
			'after_title'   => "</h2>\n",
			'before_widget' => '<section>',
			'after_widget'  => "</section>\n",
		);
		$instance = array( 'title' => 'Buscar' );

		ob_start();
		$widget->widget( $args, $instance );
		$output = ob_get_clean();

		$this->assertContains( '<h2>Buscar</h2>', $output );
		$this->assertContains( '<section>', $output );
		$this->assertContains( '</section>', $output );

		// No title
		ob_start();
		$widget->widget( $args, array() );
		$output = ob_get_clean();
		$this->assertNotContains( '<h2>Buscar</h2>', $output );
	}
}

class Test_Media_Widget extends WP_Widget_Media {
	public function render_media( $instance ) {}
}
