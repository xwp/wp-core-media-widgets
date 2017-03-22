<?php
/**
 * Unit tests covering WP_Widget_Image functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-image.php
 *
 * @group widgets
 */
class Test_WP_Widget_Image extends WP_UnitTestCase {

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Image::get_instance_schema
	 */
	function test_get_instance_schema() {
		if ( version_compare( PHP_VERSION, '5.3', '<' ) ) {
			return $this->markTestSkipped( 'ReflectionMethod::setAccessible is only available for PHP 5.3+' );
		}

		$wp_widget_image     = new ReflectionClass( 'WP_Widget_Image' );
		$get_instance_schema = $wp_widget_image->getMethod( 'get_instance_schema' );
		$get_instance_schema->setAccessible( true );

		$schema = $get_instance_schema->invoke( new WP_Widget_Image );

		$this->assertEqualSets( array(
			'align',
			'alt',
			'attachment_id',
			'caption',
			'height',
			'image_classes',
			'image_title',
			'link_classes',
			'link_rel',
			'link_target_blank',
			'link_type',
			'link_url',
			'size',
			'title',
			'url',
			'width',
		), array_keys( $schema ) );
	}

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Image::update
	 */
	function test_update() {
		$widget   = new WP_Widget_Image();
		$instance = array();

		// Should return valid attachment ID.
		$expected = array(
			'attachment_id' => 1,
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment ID.
		$result = $widget->update( array(
			'attachment_id' => 'media',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid attachment url.
		$expected = array(
			'url' => 'https://example.org',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment url.
		$result = $widget->update( array(
			'url' => 'not_a_url',
		), $instance );
		$this->assertNotSame( $result, $instance );
		$this->assertStringStartsWith( 'http://', $result['url'] );

		// Should return valid attachment title.
		$expected = array(
			'title' => 'What a title',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid attachment title.
		$result = $widget->update( array(
			'title' => '<h1>W00t!</h1>',
		), $instance );
		$this->assertNotSame( $result, $instance );

		// Should return valid image size.
		$expected = array(
			'size' => 'thumbnail',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image size.
		$result = $widget->update( array(
			'size' => 'big league',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image width.
		$expected = array(
			'width' => 300,
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image width.
		$result = $widget->update( array(
			'width' => 'wide',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image height.
		$expected = array(
			'height' => 200,
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image height.
		$result = $widget->update( array(
			'height' => 'high',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image alignment.
		$expected = array(
			'align' => 'right',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image alignment.
		$result = $widget->update( array(
			'align' => 'next to caption',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image caption.
		$expected = array(
			'caption' => 'A caption with <a href="#">link</a>',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image caption.
		$result = $widget->update( array(
			'caption' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'caption' => '"&gt;<i />',
		) );

		// Should return valid alt text.
		$expected = array(
			'alt' => 'A water tower',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid alt text.
		$result = $widget->update( array(
			'alt' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'alt' => '">',
		) );

		// Should return valid link type.
		$expected = array(
			'link_type' => 'file',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid link type.
		$result = $widget->update( array(
			'link_type' => 'interesting',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid link url.
		$expected = array(
			'link_url' => 'https://example.org',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid link url.
		$result = $widget->update( array(
			'link_url' => 'not_a_url',
		), $instance );
		$this->assertNotSame( $result, $instance );
		$this->assertStringStartsWith( 'http://', $result['link_url'] );

		// Should return valid image classes.
		$expected = array(
			'image_classes' => 'A water tower',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image classes.
		$result = $widget->update( array(
			'image_classes' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'image_classes' => 'i onloadalerthello',
		) );

		// Should return valid link classes.
		$expected = array(
			'link_classes' => 'A water tower',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid link classes.
		$result = $widget->update( array(
			'link_classes' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'link_classes' => 'i onloadalerthello',
		) );

		// Should return valid rel text.
		$expected = array(
			'link_rel' => 'previous',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid rel text.
		$result = $widget->update( array(
			'link_rel' => '"><i onload="alert(\'hello\')" />',
		), $instance );
		$this->assertSame( $result, array(
			'link_rel' => 'i onloadalerthello',
		) );

		// Should return valid link target.
		$expected = array(
			'link_target_blank' => false,
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid  link target.
		$result = $widget->update( array(
			'link_target_blank' => 'top',
		), $instance );
		$this->assertSame( $result, $instance );

		// Should return valid image title.
		$expected = array(
			'image_title' => 'What a title',
		);
		$result   = $widget->update( $expected, $instance );
		$this->assertSame( $result, $expected );

		// Should filter invalid image title.
		$result = $widget->update( array(
			'image_title' => '<h1>W00t!</h1>',
		), $instance );
		$this->assertNotSame( $result, $instance );

		// Should filter invalid key.
		$result = $widget->update( array(
			'imaginary_key' => 'value',
		), $instance );
		$this->assertSame( $result, $instance );
	}

	/**
	 * Test render_media method.
	 *
	 * @covers WP_Widget_Image::render_media
	 */
	function test_render_media() {
		$widget        = new WP_Widget_Image();
		$attachment_id = self::factory()->attachment->create_object( DIR_TESTDATA . '/images/canola.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_title' => 'Canola',
		) );
		wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, DIR_TESTDATA . '/images/canola.jpg' ) );

		// Should be empty when there is no attachment_id.
		ob_start();
		$widget->render_media( array() );
		$output = ob_get_clean();
		$this->assertEmpty( $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
		) );
		$output = ob_get_clean();

		// Default title to image title.
		$this->assertContains( 'title="Canola"', $output );
		// Default image classes.
		$this->assertContains( 'class="image wp-image-' . $attachment_id, $output );
		$this->assertContains( 'style="max-width: 100%; height: auto;"', $output );
		$this->assertContains( 'alt=""', $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'image_title' => 'Custom Title',
			'image_classes' => 'custom-class',
			'alt' => 'A flower',
		) );
		$output = ob_get_clean();

		// Custom image title.
		$this->assertContains( 'title="Custom Title"', $output );
		// Custom image class.
		$this->assertContains( 'class="image wp-image-' . $attachment_id . ' custom-class', $output );
		$this->assertContains( 'alt="A flower"', $output );

		// Link settings.
		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'link_type' => 'file',
		) );
		$output = ob_get_clean();

		$link = '<a href="' . wp_get_attachment_url( $attachment_id ) . '"';
		$this->assertContains( $link, $output );
		$link .= ' class=""';
		$this->assertContains( $link, $output );
		$link .= ' rel=""';
		$this->assertContains( $link, $output );
		$link .= ' target=""';
		$this->assertContains( $link, $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'link_type' => 'post',
			'link_classes' => 'custom-link-class',
			'link_rel' => 'attachment',
			'link_target_blank' => false,
		) );
		$output = ob_get_clean();

		$this->assertContains( '<a href="' . get_attachment_link( $attachment_id ) . '"', $output );
		$this->assertContains( 'class="custom-link-class"', $output );
		$this->assertContains( 'rel="attachment"', $output );
		$this->assertContains( 'target=""', $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'link_type' => 'custom',
			'link_url' => 'https://example.org',
			'link_target_blank' => true,
		) );
		$output = ob_get_clean();

		$this->assertContains( '<a href="https://example.org"', $output );
		$this->assertContains( 'target="_blank"', $output );

		// Caption settings.
		wp_update_post( array(
			'ID' => $attachment_id,
			'post_excerpt' => 'Default caption',
		) );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
		) );
		$output = ob_get_clean();

		$this->assertContains( 'class="wp-caption alignnone"', $output );
		$this->assertContains( '<p class="wp-caption-text">Default caption</p>', $output );

		ob_start();
		$widget->render_media( array(
			'attachment_id' => $attachment_id,
			'caption' => 'Custom caption',
		) );
		$output = ob_get_clean();

		$this->assertContains( 'class="wp-caption alignnone"', $output );
		$this->assertContains( '<p class="wp-caption-text">Custom caption</p>', $output );
	}

	/**
	 * Test enqueue_admin_scripts method.
	 *
	 * @covers WP_Widget_Image::enqueue_admin_scripts
	 */
	function test_enqueue_admin_scripts() {
		$widget = new WP_Widget_Image();
		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'media-image-widget' ) );
	}

	/**
	 * Test render_control_template_scripts method.
	 *
	 * @covers WP_Widget_Image::render_control_template_scripts
	 */
	function test_render_control_template_scripts() {
		$widget = new WP_Widget_Image();

		ob_start();
		$widget->render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-wp-media-widget-image-preview">', $output );
	}
}
