<?php
if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
/**
 * Template Text
 * 
 * Access original fields: $args['mod_settings']
 * @author Themify
 */

if (TFCache::start_cache($args['mod_name'], self::$post_id, array('ID' => $args['module_ID']))):
$fields_default = array(
    'mod_title_text' => '',
    'content_text' => '',
    'text_drop_cap' => '',
    'add_css_text' => '',
    'background_repeat' => '',
    'animation_effect' => ''
);
$fields_args = wp_parse_args($args['mod_settings'], $fields_default);
unset($args['mod_settings']);
$animation_effect = self::parse_animation_effect($fields_args['animation_effect'], $fields_args);
$dropcap = $fields_args['text_drop_cap'] === 'dropcap' ? 'tb_text_dropcap' : '';
$container_class =apply_filters('themify_builder_module_classes', array(
    'module', 'module-' . $args['mod_name'], $args['module_ID'],  $fields_args['add_css_text'], $fields_args['background_repeat'], $animation_effect, $dropcap
                ), $args['mod_name'], $args['module_ID'], $fields_args);
if(!empty($args['element_id'])){
    $container_class[] = 'tb_'.$args['element_id'];
}
$container_props = apply_filters('themify_builder_module_container_props', array(
    'class' =>  implode(' ', $container_class),
        ), $fields_args, $args['mod_name'], $args['module_ID']);
$fields_args['content_text'] = TB_Text_Module::generate_read_more( $fields_args['content_text'] );
?>
<!-- module text -->
<div <?php echo self::get_element_attributes(self::sticky_element_props($container_props,$fields_args)); ?>>
    <?php if ($fields_args['mod_title_text'] !== ''): ?>
        <?php echo $fields_args['before_title'] . apply_filters('themify_builder_module_title', $fields_args['mod_title_text'], $fields_args). $fields_args['after_title']; ?>
    <?php endif; ?>
    <div  class="tb_text_wrap<?php if(Themify_Builder::$frontedit_active):?> tb_editor_enable<?php endif; ?>"<?php if(Themify_Builder::$frontedit_active):?> contenteditable="false"  data-name="content_text"<?php endif;?>>
    <?php echo apply_filters('themify_builder_module_content', $fields_args['content_text']); ?>
    </div>
</div>
<!-- /module text -->
<?php endif; ?>
<?php TFCache::end_cache(); ?>