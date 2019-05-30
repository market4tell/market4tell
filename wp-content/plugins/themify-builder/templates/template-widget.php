<?php
if (!defined('ABSPATH'))
	exit; // Exit if accessed directly
/**
 * Template Widget
 * 
 * Access original fields: $args['mod_settings']
 * @author Themify
 */
if (TFCache::start_cache($args['mod_name'], self::$post_id, array('ID' => $args['module_ID']))):
	global $wp_widget_factory;

	$fields_default = array(
		'mod_title_widget' => '',
		'class_widget' => '',
		'instance_widget' => array(),
		'custom_css_widget' => '',
		'background_repeat' => '',
		'animation_effect' => ''
	);
	$fields_args = wp_parse_args( $args['mod_settings'], $fields_default );
	unset( $args['mod_settings'] );
	$animation_effect = self::parse_animation_effect( $fields_args['animation_effect'], $fields_args );

	$container_class = apply_filters( 'themify_builder_module_classes', array(
		'module', 'module-' . $args['mod_name'], $args['module_ID'],$fields_args['custom_css_widget'], $fields_args['background_repeat'], $animation_effect
		), $args['mod_name'], $args['module_ID'], $fields_args );
	if(!empty($args['element_id'])){
	    $container_class[] = 'tb_'.$args['element_id'];
	}
	$container_props = apply_filters('themify_builder_module_container_props', array(
		'class' => implode( ' ', $container_class),
	), $fields_args, $args['mod_name'], $args['module_ID']);
	

	?>

	<!-- module widget -->
	<div <?php echo self::get_element_attributes(self::sticky_element_props($container_props,$fields_args)); ?>>
		<?php
		if ( $fields_args['mod_title_widget'] !== '' ) {
			echo $fields_args['before_title'] . apply_filters( 'themify_builder_module_title', $fields_args['mod_title_widget'], $fields_args ). $fields_args['after_title'];
		}
		do_action( 'themify_builder_before_template_content_render' );

		if ( $fields_args['class_widget'] !== '' && class_exists( $fields_args['class_widget'] ) && isset( $wp_widget_factory->widgets[ $fields_args['class_widget'] ] ) ) {
		    // Backward compatibility with how widget data used to be saved.
		    $fields_args['instance_widget'] = TB_Widget_Module::sanitize_widget_instance( $fields_args['instance_widget'] );
			//WC gets by widget_id not by widget-id,which is bug of WC
			the_widget( $fields_args['class_widget'], $fields_args['instance_widget'],array('widget_id'=>isset($fields_args['instance_widget']['widget-id'])?$fields_args['instance_widget']['widget-id']: $args['module_ID']) );
		}
		do_action('themify_builder_after_template_content_render');
		?>
	</div><!-- /module widget -->
<?php endif; ?>
<?php TFCache::end_cache(); ?>