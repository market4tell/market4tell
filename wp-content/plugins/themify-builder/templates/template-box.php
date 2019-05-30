<?php
if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
/**
 * Template Box
 * 
 * Access original fields: $args['mod_settings']
 * @author Themify
 */
if (TFCache::start_cache($args['mod_name'], self::$post_id, array('ID' => $args['module_ID']))):

    $fields_default = array(
        'mod_title_box' => '',
        'content_box' => '',
        'appearance_box' => '',
        'color_box' => '',
        'add_css_box' => '',
        'background_repeat' => '',
        'animation_effect' => ''
    );

    if (isset($args['mod_settings']['appearance_box'])) {
        $args['mod_settings']['appearance_box'] = self::get_checkbox_data($args['mod_settings']['appearance_box']);
    }
    $fields_args = wp_parse_args($args['mod_settings'], $fields_default);
    unset($args['mod_settings']);
    $animation_effect = self::parse_animation_effect($fields_args['animation_effect'], $fields_args);

    $container_class =apply_filters('themify_builder_module_classes', array(
        'module', 'module-' . $args['mod_name'], $args['module_ID'], $animation_effect, $fields_args['add_css_box']
                    ), $args['mod_name'], $args['module_ID'], $fields_args);
    if(!empty($args['element_id'])){
	$container_class[] = 'tb_'.$args['element_id'];
    }
    $inner_container_classes = implode(' ', apply_filters('themify_builder_module_inner_classes', array(
        'module-' . $args['mod_name'] . '-content ui',  $fields_args['appearance_box'], $fields_args['color_box'], $fields_args['background_repeat']
            ))
    ); 
    $container_props = apply_filters('themify_builder_module_container_props', array(
        'class' =>  implode(' ', $container_class),
            ), $fields_args, $args['mod_name'], $args['module_ID']);
    ?>
    <!-- module box -->
    <div <?php echo self::get_element_attributes(self::sticky_element_props($container_props,$fields_args)); ?>>
        <?php if ($fields_args['mod_title_box'] !== ''): ?>
            <?php echo $fields_args['before_title'] . apply_filters('themify_builder_module_title', $fields_args['mod_title_box'], $fields_args). $fields_args['after_title']; ?>
        <?php endif; ?>
        <div class="<?php echo $inner_container_classes; ?>">
	    <div<?php if(Themify_Builder::$frontedit_active):?> contenteditable="false" data-name="content_box"<?php endif;?> class="tb_text_wrap<?php if(Themify_Builder::$frontedit_active):?> tb_editor_enable<?php endif;?>"><?php echo apply_filters('themify_builder_module_content', $fields_args['content_box']); ?></div>
        </div>
    </div>
    <!-- /module box -->
<?php endif; ?>
<?php TFCache::end_cache(); ?>