<?php
/**
 * Unit tests covering WP_Widget_Media_Video functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-video.php
 *
 * @group widgets
 */
class Test_WP_Widget_Media_Video extends WP_UnitTestCase {

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Media_Video::get_instance_schema()
	 */
	function test_get_instance_schema() {
		$widget = new WP_Widget_Media_Video();
		$schema = $widget->get_instance_schema();

		$this->assertEqualSets(
			array_merge(
				array(
					'attachment_id',
					'autoplay',
					'poster',
					'preload',
					'loop',
					'title',
					'url',
					'content',
					'width',
					'height',
				),
				wp_get_video_extensions()
			),
			array_keys( $schema )
		);
	}

	/**
	 * Test constructor.
	 *
	 * @covers WP_Widget_Media_Video::__construct()
	 */
	function test_constructor() {
		$widget = new WP_Widget_Media_Video();

		$this->assertArrayHasKey( 'mime_type', $widget->widget_options );
		$this->assertArrayHasKey( 'customize_selective_refresh', $widget->widget_options );
		$this->assertArrayHasKey( 'description', $widget->widget_options );
		$this->assertTrue( $widget->widget_options['customize_selective_refresh'] );
		$this->assertEquals( 'video', $widget->widget_options['mime_type'] );
		$this->assertEqualSets( array(
			'add_to_widget',
			'change_media',
			'edit_media',
			'media_library_state_multi',
			'media_library_state_single',
			'missing_attachment',
			'no_media_selected',
			'select_media',
		), array_keys( $widget->l10n ) );
	}

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Media_Video::update()
	 */
	function test_update() {
		$widget = new WP_Widget_Media_Video();
		$instance = array();

		// Should return valid attachment ID.
		$expected = array(
			'attachment_id' => 1,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment ID.
		$result = $widget->update( array(
			'attachment_id' => 'media',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid attachment url.
		$expected = array(
			'url' => 'https://chickenandribs.org',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment url.
		$result = $widget->update( array(
			'url' => 'not_a_url',
		), $instance );
		$this->assertNotSame( $result, $instance );
		$this->assertStringStartsWith( 'http://', $result['url'] );

		// Should return valid poster url.
		$expected = array(
			'poster' => 'https://chickenandribs.org/some-poster-image.jpg',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid poster url.
		$result = $widget->update( array(
			'poster' => 'not_a_url',
		), $instance );
		$this->assertNotSame( $result, $instance );
		$this->assertStringStartsWith( 'http://', $result['poster'] );

		// Should return autoplay setting.
		$expected = array(
			'autoplay' => false,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid autoplay setting.
		$result = $widget->update( array(
			'autoplay' => 'not-boolean',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return loop setting.
		$expected = array(
			'loop' => true,
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid loop setting.
		$result = $widget->update( array(
			'loop' => 'not-boolean',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid attachment title.
		$expected = array(
			'title' => 'A video of goats',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment title.
		$result = $widget->update( array(
			'title' => '<h1>Cute Baby Goats</h1>',
		), $instance );
		$this->assertNotSame( $result, $instance );

		// Should return valid preload setting.
		$expected = array(
			'preload' => 'none',
		);
		$result = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid preload setting.
		$result = $widget->update( array(
			'preload' => 'nope',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should filter invalid key.
		$result = $widget->update( array(
			'h4x' => 'value',
		), $instance );
		$this->assertSame( $result, $instance );

		// Width and height are handled.
		$result = $widget->update(
			array(
				'width' => -1,
				'height' => 'bad',
			),
			array()
		);
		$this->assertEmpty( $result );
		$result = $widget->update(
			array(
				'width' => 3,
				'height' => '4',
			),
			array()
		);
		$this->assertSame(
			$result,
			array(
				'width' => 3,
				'height' => 4,
			)
		);
	}

	/**
	 * Test render_media method.
	 *
	 * @covers WP_Widget_Media_Video::render_media()
	 */
	function test_render_media() {
		$test_movie_file = __FILE__ . '../data/small-video.m4v';
		$widget = new WP_Widget_Media_Video();
		$attachment_id = self::factory()->attachment->create_object( array(
			'file' => $test_movie_file,
			'post_parent' => 0,
			'post_mime_type' => 'video/mp4',
			'post_title' => 'Test Video',
		) );
		wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $test_movie_file ) );

		// Should be empty when there is no attachment_id.
		ob_start();
		$widget->render_media( array() );
		$output = ob_get_clean();
		$this->assertEmpty( $output );

		// Should be empty when there is an invalid attachment_id.
		ob_start();
		$widget->render_media( array(
			'attachment_id' => 777,
		) );
		$output = ob_get_clean();
		$this->assertEmpty( $output );

		// Tests with video from library.
		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
		) );
		$output = ob_get_clean();

		// Check default outputs.
		$this->assertContains( 'preload="none"', $output );
		$this->assertContains( 'class="wp-video"', $output );
		$this->assertContains( 'small-video.m4v', $output );

		// Auto parses dimensions.
		$this->assertContains( 'width="640"', $output );
		$this->assertContains( 'height="360"', $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'title' => 'Open Source Cartoon',
			'preload' => 'auto',
			'loop' => true,
			'autoplay' => true,
			'poster' => 'http://chickenandribs.org/poster-image.jpg',
			'width' => 1000,
			'height' => 500,
		) );
		$output = ob_get_clean();

		// Custom attributes.
		$this->assertContains( 'preload="auto"', $output );
		$this->assertContains( 'loop="1"', $output );
		$this->assertContains( 'autoplay="1"', $output );
		$this->assertContains( 'poster="http://chickenandribs.org/poster-image.jpg"', $output );
		$this->assertContains( 'width="1000"', $output );
		$this->assertContains( 'height="500"', $output );

		// Externally hosted video.
		ob_start();
		$content = '<track srclang="en" label="English" kind="subtitles" src="http://example.com/wp-content/uploads/2017/04/subtitles-en.vtt">';
		$widget->render_media( array(
			'attachment_id' => null,
			'autoplay' => true,
			'loop' => false,
			'url' => 'https://www.youtube.com/watch?v=OQSNhk5ICTI',
			'poster' => 'https://img.youtube.com/vi/OQSNhk5ICTI/mqdefault.jpg',
			'content' => $content,
		) );
		$output = ob_get_clean();

		// Custom attributes.
		$this->assertContains( 'preload="none"', $output );
		$this->assertContains( 'autoplay="1"', $output );
		$this->assertContains( 'poster="https://img.youtube.com/vi/OQSNhk5ICTI/mqdefault.jpg"', $output );
		$this->assertContains( 'src="https://www.youtube.com/watch?v=OQSNhk5ICTI', $output );
		$this->assertContains( $content, $output );
	}

	/**
	 * Test enqueue_preview_scripts method.
	 *
	 * @global WP_Scripts $wp_scripts
	 * @global WP_Styles $wp_styles
	 * @covers WP_Widget_Media_Video::enqueue_preview_scripts()
	 */
	function test_enqueue_preview_scripts() {
		global $wp_scripts, $wp_styles;
		$widget = new WP_Widget_Media_Video();

		$wp_scripts = null;
		$wp_styles = null;
		$widget->enqueue_preview_scripts();
		$this->assertTrue( wp_script_is( 'wp-mediaelement' ) );
		$this->assertTrue( wp_style_is( 'wp-mediaelement' ) );
		$this->assertTrue( wp_script_is( 'froogaloop' ) );

		$wp_scripts = null;
		$wp_styles = null;
		add_filter( 'wp_video_shortcode_library', '__return_empty_string' );
		$widget->enqueue_preview_scripts();
		$this->assertFalse( wp_script_is( 'wp-mediaelement' ) );
		$this->assertFalse( wp_style_is( 'wp-mediaelement' ) );
		$this->assertTrue( wp_script_is( 'froogaloop' ) );
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Media_Video::enqueue_admin_scripts()
	 */
	function test_enqueue_admin_scripts() {
		$widget = new WP_Widget_Media_Video();
		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'media-video-widget' ) );
	}

	/**
	 * Test render_control_template_scripts method.
	 *
	 * @covers WP_Widget_Media_Video::render_control_template_scripts()
	 */
	function test_render_control_template_scripts() {
		$widget = new WP_Widget_Media_Video();

		ob_start();
		$widget->render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-wp-media-widget-video-preview">', $output );
	}
}
