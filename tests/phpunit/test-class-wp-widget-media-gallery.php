<?php
/**
 * Unit tests covering WP_Widget_Media_Gallery functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-gallery.php
 *
 * @group widgets
 */
class Test_WP_Widget_Media_Gallery extends WP_UnitTestCase {

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Media_Gallery::get_instance_schema()
	 */
	function test_get_instance_schema() {
		$widget = new WP_Widget_Media_Gallery();
		$schema = $widget->get_instance_schema();

		$this->assertEqualSets(
			array(
				'title',
				'ids',
				'columns',
				'size',
				'link_type',
				'orderby_random',
			),
			array_keys( $schema )
		);
	}

}
