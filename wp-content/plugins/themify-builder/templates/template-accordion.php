<?php
if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
/**
 * Template Accordion
 * 
 * Access original fields: $args['mod_settings']
 * @author Themify
 */
if (TFCache::start_cache($args['mod_name'], self::$post_id, array('ID' => $args['module_ID']))):

    $fields_default = array(
        'mod_title_accordion' => '',
        'layout_accordion' => 'plus-icon-button',
        'expand_collapse_accordion' => 'toggle',
        'color_accordion' => '',
        'accordion_appearance_accordion' => '',
        'content_accordion' => array(),
        'animation_effect' => '',
        'icon_accordion' => '',
        'icon_color_accordion' => '',
        'icon_active_accordion' => '',
        'icon_active_accordion' => '',
        'icon_active_color_accordion' => '',
        'css_accordion' => ''
    );

    if (isset($args['mod_settings']['accordion_appearance_accordion'])) {
        $args['mod_settings']['accordion_appearance_accordion'] = self::get_checkbox_data($args['mod_settings']['accordion_appearance_accordion']);
    }
    $fields_args = wp_parse_args($args['mod_settings'], $fields_default);
    unset($args['mod_settings']);
    $animation_effect = self::parse_animation_effect($fields_args['animation_effect'], $fields_args);
    
    $container_class = apply_filters('themify_builder_module_classes', array(
        'module', 'module-' . $args['mod_name'], $args['module_ID'], $fields_args['css_accordion'], $animation_effect
                    ), $args['mod_name'], $args['module_ID'], $fields_args);
    if(!empty($args['element_id'])){
	$container_class[] = 'tb_'.$args['element_id'];
    }
    $container_props = apply_filters('themify_builder_module_container_props', array(
        'class' => implode(' ', $container_class),
        'data-behavior' => $fields_args['expand_collapse_accordion']
    ), $fields_args, $args['mod_name'], $args['module_ID']);

    $ui_class = implode(' ', array('ui', 'module-' . $args['mod_name'], $fields_args['layout_accordion'], $fields_args['accordion_appearance_accordion'], $fields_args['color_accordion']));
    ?>
    <!-- module accordion -->
    <div <?php echo self::get_element_attributes(self::sticky_element_props($container_props,$fields_args)); ?>>
        <?php if ($fields_args['mod_title_accordion'] !== ''): ?>
            <?php echo $fields_args['before_title'] . apply_filters('themify_builder_module_title', $fields_args['mod_title_accordion'], $fields_args) . $fields_args['after_title']; ?>
        <?php endif; ?>

        <ul class="<?php echo $ui_class ?>">
            <?php
            $content_accordion = array_filter($fields_args['content_accordion']);
            foreach ($content_accordion as $i=>$content):
                $content = wp_parse_args($content, array(
                    'title_accordion' => '',
                    'default_accordion' => 'closed',
                    'text_accordion' => '',
                ));
                ?>
                <li<?php if ($content['default_accordion'] === 'open'):?> class="builder-accordion-active"<?php endif;?> aria-expanded="<?php echo ($content['default_accordion'] === 'open')? "true" : "false" ; ?>">
                    <div class="accordion-title">
                        <a href="#">
                            <?php if ($fields_args['icon_accordion'] !== '') : ?><i class="accordion-icon <?php echo themify_get_icon($fields_args['icon_accordion']); ?>"></i><?php endif; ?>
                            <?php if ($fields_args['icon_active_accordion'] !== '') : ?><i class="accordion-active-icon fa <?php echo $fields_args['icon_active_accordion']; ?>"></i><?php endif; ?>
			    <span class="tb_title_accordion"<?php if(Themify_Builder::$frontedit_active):?> contenteditable="false" data-repeat="content_accordion" data-name="title_accordion" data-index="<?php echo $i?>"<?php endif;?>><?php echo $content['title_accordion']; ?></span>
                        </a>
                    </div>
                    <div class="accordion-content clearfix <?php if ($content['default_accordion'] !== 'open'): ?> default-closed<?php endif; ?>">
                        <?php if ($content['text_accordion']!==''):?>
			    <div<?php if(Themify_Builder::$frontedit_active):?> contenteditable="false" data-name="text_accordion" data-repeat="content_accordion" data-index="<?php echo $i?>"<?php endif;?>  class="<?php if(Themify_Builder::$frontedit_active):?>tb_editor_enable <?php endif;?>tb_text_wrap">
				<?php echo apply_filters('themify_builder_module_content', $content['text_accordion']);?>
			    </div>
                        <?php endif;?>
                        
                    </div>
                </li>
            <?php endforeach; ?>
        </ul>

    </div>
    <!-- /module accordion -->
<?php endif; ?>
<?php TFCache::end_cache(); ?>