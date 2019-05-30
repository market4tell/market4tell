<?php
if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
///////////////////////////////////////
// Switch Template Layout Types
///////////////////////////////////////
if (TFCache::start_cache($mod_name, self::$post_id, array('ID' => $module_ID))) {
    $slider_default = array(
        'layout_slider' => '',
        'img_h_slider' => '',
        'img_w_slider' => '',
        'image_size_slider' => '',
        'css_slider' => '',
        'animation_effect' => '',
	'grid_layout_testimonial'=>'grid3'
    );

    $settings = wp_parse_args($args['mod_settings'], $slider_default);
    unset($args['mod_settings']);
    $animation_effect = self::parse_animation_effect($settings['animation_effect'], $settings);
    $container_class =  apply_filters('themify_builder_module_classes', array(
        'module', 'module-' . $mod_name, $module_ID, 'clearfix', $settings['css_slider'], $settings['layout_slider'], $animation_effect
                    ), $mod_name, $module_ID, $settings);
    if(!empty($args['element_id'])){
	$container_class[] = 'tb_'.$args['element_id'];
    }
    $container_props = apply_filters('themify_builder_module_container_props', array(
        'id' => $module_ID,
        'class' => implode(' ',$container_class)
            ), $settings, $mod_name, $module_ID);
    $settings['margin'] = '';
    ?>
    <div<?php echo self::get_element_attributes($container_props); ?>>
        <ul class="themify_builder_testimonial loops-wrapper builder-posts-wrap <?php echo $settings['grid_layout_testimonial']; ?>">
                <?php
                self::retrieve_template('template-' . $mod_name . '-content.php', array(
                    'module_ID' => $module_ID,
                    'mod_name' => $mod_name,
                    'settings' => $settings
                        ), '', '', true);
                ?>
        </ul>
    </div>
        <?php
}
TFCache::end_cache();
    