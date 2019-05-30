<?php
if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
/**
 * Template Plain Text
 * 
 * Access original fields: $args['mod_settings']
 * @author Themify
 */
if (TFCache::start_cache($args['mod_name'], self::$post_id, array('ID' => $args['module_ID']))):
    $fields_default = array(
        'plain_text' => '',
        'add_css_text' => '',
        'animation_effect' => ''
    );

    $fields_args = wp_parse_args($args['mod_settings'], $fields_default);
    unset($args['mod_settings']);
    $animation_effect = self::parse_animation_effect($fields_args['animation_effect'], $fields_args);

    $container_class =  apply_filters('themify_builder_module_classes', array(
        'module', 'module-' . $args['mod_name'], $args['module_ID'],$fields_args['add_css_text'], $animation_effect
                    ), $args['mod_name'], $args['module_ID'], $fields_args);
    if(!empty($args['element_id'])){
	$container_class[] = 'tb_'.$args['element_id'];
    }
    $container_props = apply_filters('themify_builder_module_container_props', array(
    'class' => implode(' ',$container_class),
        ), $fields_args, $args['mod_name'], $args['module_ID']);
    ?>
    <!-- module plain text -->
    <div <?php echo self::get_element_attributes(self::sticky_element_props($container_props,$fields_args)); ?>>
	<div class="tb_text_wrap"<?php if(Themify_Builder::$frontedit_active):?> contenteditable="false" data-name="plain_text"<?php endif; ?> >
	    <?php echo $fields_args['plain_text'] !== ''?apply_filters('themify_builder_module_content',$fields_args['plain_text']):''; ?>
	</div>
    </div>
    <!-- /module plain text -->
<?php endif; ?>
<?php TFCache::end_cache(); ?>