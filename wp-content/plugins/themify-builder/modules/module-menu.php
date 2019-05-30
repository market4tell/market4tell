<?php

if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
/**
 * Module Name: Menu
 * Description: Display Custom Menu
 */

class TB_Menu_Module extends Themify_Builder_Component_Module {

    function __construct() {
	parent::__construct(array(
	    'name' => __('Menu', 'themify'),
	    'slug' => 'menu'
	));
    }

    public function get_title($module) {
	return isset($module['mod_settings']['custom_menu']) ? $module['mod_settings']['custom_menu'] : '';
    }

    public function get_options() {
	return array(
	    array(
		'id' => 'mod_title_menu',
		'type' => 'title'
	    ),
	    array(
		'id' => 'layout_menu',
		'type' => 'layout',
		'label' => __('Menu Layout', 'themify'),
		'mode' => 'sprite',
		'options' => array(
		    array('img' => 'menu_bar', 'value' => 'menu-bar', 'label' => __('Menu Bar', 'themify')),
		    array('img' => 'menu_fullbar', 'value' => 'fullwidth', 'label' => __('Menu Fullbar', 'themify')),
		    array('img' => 'menu_vertical', 'value' => 'vertical', 'label' => __('Menu Vertical', 'themify'))
		)
	    ),
	    array(
		'id' => 'custom_menu',
		'type' => 'select_menu',
		'label' => __('Custom Menu', 'themify')
	    ),
	    array(
		'id' => 'allow_menu_fallback',
		'label' => '',
		'type' => 'checkbox',
		'options' => array(
		    array('name' => 'allow_fallback', 'value' => __('If no menu found, list all pages', 'themify'))
		)
	    ),
	    array(
		'id' => 'allow_menu_breakpoint',
		'label' =>  __('Mobile Menu', 'themify'),
		'type' => 'toggle_switch',
		'options' => array(
		    'on' => array('name'=>'allow_menu','value' =>'en'),
		    'off' => array('name'=>'', 'value' =>'dis')
		),
		'binding' => array(
			'checked' => array(
				'show' => array('menu_breakpoint')
			),
			'not_checked' => array(
				'hide' => array('menu_breakpoint')
			)
		)
	    ),
	    array(
		'id' => 'menu_breakpoint',
		'label' => '',
		'class' => 'xsmall',
		'type' => 'text',
		'after' => __('Breakpoint (px)', 'themify'),
		'binding' => array(
		    'empty' => array(
			'hide' => array('menu_slide_direction')
		    ),
		    'not_empty' => array(
			'show' => array('menu_slide_direction')
		    )
		),
		'wrap_class' => 'tb-checkbox_element_allow_menu'
	    ),
	    array(
		'id' => 'menu_slide_direction',
		'label' => '',
		'type' => 'select',
		'after' => __('Mobile slide direction', 'themify'),
		'options' => array(
		    'right' => __('Right', 'themify'),
		    'left' => __('Left', 'themify')
		),
		'wrap_class' => 'tb-checkbox_element_allow_menu'
	    ),
	    array(
		'id' => 'color_menu',
		'type' => 'layout',
		'label' => __('Color', 'themify'),
		'class' => 'tb_colors',
		'mode' => 'sprite',
		'color' => true,
		'transparent'=>true
	    ),
	    array(
		'id' => 'according_style_menu',
		'type' => 'checkbox',
		'label' => __('Appearance', 'themify'),
		'appearance' => true
	    ),
	    array(
		'id' => 'css_menu',
		'type' => 'custom_css'
	    ),
	    array('type' => 'custom_css_id')
	);
    }

    public function get_visual_type() {
	return 'ajax';
    }

    public function get_styling() {
	$general = array(
	    // Background
	    self::get_expand('bg', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color('', 'background_color', 'bg_c', 'background-color')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color('', 'bg_c', 'bg_c', 'background-color', 'h')
			)
		    )
		))
	    )),
	    // Font
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_font_family(' .nav li'),
			    self::get_color(' .nav li', 'font_color'),
			    self::get_font_size(' .nav li'),
			    self::get_line_height(' .nav li'),
			    self::get_letter_spacing(' .nav li'),
			    self::get_text_align(' .nav'),
			    self::get_text_transform(' .nav'),
			    self::get_font_style(' .nav'),
			    self::get_text_shadow(' .nav li'),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_font_family(' .nav li', 'f_f', 'h'),
			    self::get_color(' .nav li', 'f_c',  null, null, 'h'),
			    self::get_font_size(' .nav li', 'f_s', '', 'h'),
			    self::get_line_height(' .nav li', 'l_h', 'h'),
			    self::get_letter_spacing(' .nav li', 'l_s', 'h'),
			    self::get_text_align(' .nav', 't_a', 'h'),
			    self::get_text_transform(' .nav', 't_t', 'h'),
			    self::get_font_style(' .nav', 'f_st', 'f_w', 'h'),
			    self::get_text_shadow(' .nav li','t_sh','h'),
			)
		    )
		))
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_padding('')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_padding('', 'p', 'h')
			)
		    )
		))
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_margin()
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_margin('', 'm', 'h')
			)
		    )
		))
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_border('')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_border('', 'b', 'h')
			)
		    )
		))
	    )),
        // Filter
        self::get_expand('f_l', array(self::get_blend())),
				// Height & Min Height
				self::get_expand('ht', array(
						self::get_height(),
						self::get_min_height(),
					)
				),
		// Rounded Corners
		self::get_expand('r_c', array(
				self::get_tab(array(
					'n' => array(
						'options' => array(
							self::get_border_radius()
						)
					),
					'h' => array(
						'options' => array(
							self::get_border_radius('', 'r_c', 'h')
						)
					)
				))
			)
		),
		// Shadow
		self::get_expand('sh', array(
				self::get_tab(array(
					'n' => array(
						'options' => array(
							self::get_box_shadow()
						)
					),
					'h' => array(
						'options' => array(
							self::get_box_shadow('', 'sh', 'h')
						)
					)
				))
			)
		),
	);

	$menu_links = array(
	    // Background
	    self::get_expand('bg', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color(' .nav > li > a', 'link_background_color', 'bg_c', 'background-color')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color(' .nav > li > a', 'link_background_color', 'bg_c', 'background-color','hover')
			)
		    )
		))
	    )),
	    // Link
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color(' .nav > li > a', 'link_color'),
			    self::get_text_decoration(' .nav > li > a')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color(' .nav > li > a', 'link_color',null, null, 'hover'),
			    self::get_text_decoration(' .nav > li > a', 't_d', 'h')
			)
		    )
		))
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_padding(' .nav > li > a', 'p_m_l')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_padding(' .nav > li > a', 'p_m_l', 'h')
			)
		    )
		))
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_margin(' .nav > li > a', 'm_m_l')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_margin(' .nav > li > a', 'm_m_l', 'h')
			)
		    )
		))
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_border(' .nav > li > a', 'b_m_l')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_border(' .nav > li > a', 'b_m_l', 'h')
			)
		    )
		))
	    ))
	);

	$current_menu_links = array(
	    // Background
	    self::get_expand('bg', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color(' li.current_page_item > a,  li.current-menu-item > a', 'current-links_background_color', 'bg_c', 'background-color')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color(' li.current_page_item > a:hover,  li.current-menu-item > a:hover', 'current-links_hover_background_color', 'bg_c', 'background-color')
			)
		    )
		))
	    )),
	    // Link
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color(' li.current_page_item > a,  li.current-menu-item > a', 'current-links_color'),
			    self::get_text_decoration(' li.current_page_item a,  li.current-menu-item a', 'current-links_text_decoration')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color(' li.current_page_item > a:hover,  li.current-menu-item > a:hover', 'current-links_color_hover'),
			    self::get_text_decoration(' li.current_page_item a,  li.current-menu-item a', 'c-l_t_d','h')
			)
		    )
		))
	    ))
	);

	$menu_dropdown_links = array(
	    // Background
	    self::get_expand('bg', array(
		self::get_color(' li > ul a', 'dropdown_links_background_color', 'bg_c', 'background-color'),
		self::get_color(' li > ul a:hover', 'dropdown_links_hover_background_color', __('Background Hover', 'themify'), 'background-color')
	    )),
	    // Font
	    self::get_expand('f', array(
		self::get_font_family(' li > ul a', 'font_family_menu_dropdown_links'),
		self::get_color(' li > ul a', 'dropdown_links_color'),
		self::get_color(' li > ul a:hover', 'dropdown_links_hover_color', __('Color Hover', 'themify')),
		self::get_font_size(' li > ul a', 'font_size_menu_dropdown_links'),
		self::get_line_height(' li > ul a', 'l_h_m_d_l'),
		self::get_letter_spacing(' li > ul a', 'l_s_m_d_l'),
		self::get_text_align(' li > ul a', 't_a_m_d_l'),
		self::get_text_transform(' li > ul a', 't_t_m_d_l'),
		self::get_font_style(' li > ul a', 'f_d_l', 'f_d_b'),
		self::get_text_decoration(' li > ul a', 't_d_m_d_l'),
		self::get_text_shadow(' li > ul a', 't_sh_l'),
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_padding(' li > ul a', 'd_l_p')
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_margin(' li > ul a', 'd_l_m')
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_border(' li > ul a', 'd_l_b')
	    ))
	);

	$menu_mobile = array(
	    // Background
	    self::get_expand('bg', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color('.mobile-menu-module', 'mobile_menu_background_color', 'bg_c', 'background-color')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color('.mobile-menu-module', 'm_m_b_c', 'bg_c', 'background-color', null, 'h')
			)
		    )
		))
	    )),
	    // Link
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_font_family('.mobile-menu-module li a', 'f_f_m_m'),
			    self::get_color('.mobile-menu-module li a', 'm_c_m_m'),
			    self::get_font_size('.mobile-menu-module li a', 'f_s_m_m'),
			    self::get_line_height('.mobile-menu-module li a', 'l_h_m_m'),
			    self::get_letter_spacing('.mobile-menu-module li a', 'l_s_m_m'),
			    self::get_text_align('.mobile-menu-module li a', 't_a_m_m'),
			    self::get_text_transform('.mobile-menu-module li a', 't_t_m_m'),
			    self::get_font_style('.mobile-menu-module li a', 'f_sy_m_m', 'f_b_m_m'),
			    self::get_text_decoration('.mobile-menu-module li a', 't_d_m_m'),
				self::get_text_shadow('.mobile-menu-module li a', 't_sh_m'),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_font_family('.mobile-menu-module li a', 'f_f_m_m', 'h'),
			    self::get_color('.mobile-menu-module li a', 'm_c_h_m_m',null, null, 'h'),
			    self::get_font_size('.mobile-menu-module li a', 'f_s_m_m', 'h'),
			    self::get_line_height('.mobile-menu-module li a', 'l_h_m_m', 'h'),
			    self::get_letter_spacing('.mobile-menu-module li a', 'l_s_m_m', 'h'),
			    self::get_text_align('.mobile-menu-module li a', 't_a_m_m', 'h'),
			    self::get_text_transform('.mobile-menu-module li a', 't_t_m_m', 'h'),
			    self::get_font_style('.mobile-menu-module li a', 'f_sy_m_m', 'f_b_m_m', 'h'),
			    self::get_text_decoration('.mobile-menu-module li a', 't_d_m_m', 'h'),
				self::get_text_shadow('.mobile-menu-module li a', 't_sh_m','h'),
			)
		    )
		))
	    ))
	);
	return array(
	    'type' => 'tabs',
	    'options' => array(
		'g' => array(
		    'options' => $general
		),
		'm_t' => array(
		    'options' => $this->module_title_custom_style()
		),
		'l' => array(
		    'label' => __('Menu Links', 'themify'),
		    'options' => $menu_links
		),
		'c' => array(
		    'label' => __('Current Links', 'themify'),
		    'options' => $current_menu_links
		),
		'dl' => array(
		    'label' => __('Dropdown Links', 'themify'),
		    'options' => $menu_dropdown_links
		),
		'm' => array(
		    'label' => __('Mobile Menu', 'themify'),
		    'options' => $menu_mobile
		)
	    )
	);
    }

}

///////////////////////////////////////
// Module Options
///////////////////////////////////////
Themify_Builder_Model::register_module('TB_Menu_Module');
