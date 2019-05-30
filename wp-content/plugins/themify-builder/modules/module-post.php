<?php

if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
/**
 * Module Name: Post
 * Description: Display Posts
 */

class TB_Post_Module extends Themify_Builder_Component_Module {

    function __construct() {
	parent::__construct(array(
	    'name' => __('Post', 'themify'),
	    'slug' => 'post'
	));
    }

    public function get_title($module) {
	$type = isset($module['mod_settings']['type_query_post']) ? $module['mod_settings']['type_query_post'] : 'category';
	$category = isset($module['mod_settings']['category_post']) ? $module['mod_settings']['category_post'] : '';
	$slug_query = isset($module['mod_settings']['query_slug_post']) ? $module['mod_settings']['query_slug_post'] : '';

	if ('category' === $type) {
	    return sprintf('%s : %s', __('Category', 'themify'), $category);
	} else {
	    return sprintf('%s : %s', __('Slugs', 'themify'), $slug_query);
	}
    }

    public function get_options() {
	return array(
	    array(
		'id' => 'mod_title_post',
		'type' => 'title'
	    ),
		array(
			'type' => 'query_posts',
			'id' => 'post_type_post',
			'tax_id'=>'type_query_post',
			'term_id'=>'#tmp_id#_post',//backward compatibility
			'slug_id'=>'query_slug_post',
		),
	    array(
		'id' => 'layout_post',
		'type' => 'layout',
		'label' => __('Post Layout', 'themify'),
		'mode' => 'sprite',
		'control'=>array(
		    'classSelector'=>'.builder-posts-wrap'
		),
		'options' => array(
		    array('img' => 'list_post', 'value' => 'list-post', 'label' => __('List Post', 'themify')),
		    array('img' => 'grid2', 'value' => 'grid2', 'label' => __('Grid 2', 'themify')),
		    array('img' => 'grid3', 'value' => 'grid3', 'label' => __('Grid 3', 'themify')),
		    array('img' => 'grid4', 'value' => 'grid4', 'label' => __('Grid 4', 'themify')),
		    array('img' => 'list_thumb_image', 'value' => 'list-thumb-image', 'label' => __('List Thumb Image', 'themify')),
		    array('img' => 'grid2_thumb', 'value' => 'grid2-thumb', 'label' => __('Grid 2 Thumb', 'themify'))
		)
	    ),
	    array(
		'id' => 'post_per_page_post',
		'type' => 'text',
		'label' => __('Limit', 'themify'),
		'class' => 'xsmall',
		'help' => __('Enter number of post to display or pass over.', 'themify')
	    ),
	    array(
		'id' => 'offset_post',
		'type' => 'text',
		'label' => __('Offset', 'themify'),
		'class' => 'xsmall',
		'help' => __('Enter number of post to display or pass over.', 'themify')
	    ),
	    array(
		'id' => 'order_post',
		'type' => 'select',
		'label' => __('Order', 'themify'),
		'help' => __('Sort posts in ascending or descending order.', 'themify'),
		'order' =>true
	    ),
	    array(
		'id' => 'orderby_post',
		'type' => 'select',
		'label' => __('Order By', 'themify'),
		'orderBy'=>true,
		'binding' => array(
		    'select' => array('hide' => array('meta_key_post')),
		    'meta_value' => array('show' => array('meta_key_post')),
		    'meta_value_num' => array('show' => array('meta_key_post')),
		)
	    ),
	    array(
		'id' => 'meta_key_post',
		'type' => 'text',
		'label' => __('Custom Field Key', 'themify')
	    ),
	    array(
		'id' => 'display_post',
		'type' => 'select',
		'label' => __('Display', 'themify'),
		'options' => array(
		    'content' => __('Content', 'themify'),
		    'excerpt' => __('Excerpt', 'themify'),
		    'none' => __('None', 'themify')
		)
	    ),
	    array(
		'id' => 'hide_feat_img_post',
		'type' => 'toggle_switch',
		'label' => __('Featured Image', 'themify'),
		'binding' => array(
			'checked' => array(
				'show' => array('image_size_post', 'img_width_post','auto_fullwidth_post','img_height_post','unlink_feat_img_post')
			),
			'not_checked' => array(
				'hide' => array('image_size_post', 'img_width_post','auto_fullwidth_post','img_height_post','unlink_feat_img_post')
			)
		)
	    ),
	    array(
		'id' => 'image_size_post',
		'type' => 'select',
		'label' => __('Image Size', 'themify'),
		'hide' => !Themify_Builder_Model::is_img_php_disabled(),
		'image_size' => true
	    ),
	    array(
		'id' => 'img_width_post',
		'type' => 'text',
		'label' => __('Image Width', 'themify'),
		'class' => 'xsmall'
	    ),
		array(
			'id' => 'auto_fullwidth_post',
			'type' => 'checkbox',
			'label' => '',
			'options' => array(array('name' => '1', 'value' => __('Auto fullwidth image', 'themify'))),
			'wrap_class' => 'auto_fullwidth'
		),
	    array(
		'id' => 'img_height_post',
		'type' => 'text',
		'label' => __('Image Height', 'themify'),
		'class' => 'xsmall'
	    ),
	    array(
		'id' => 'unlink_feat_img_post',
		'type' => 'toggle_switch',
		'label' => __('Unlink Featured Image', 'themify'),
		'options' => 'simple'
	    ),
	    array(
		'id' => 'hide_post_title_post',
		'type' => 'toggle_switch',
		'label' => __('Post Title', 'themify'),
		'binding' => array(
		    'checked' => array(
			    'show' => array('unlink_post_title_post')
		    ),
		    'not_checked' => array(
			    'hide' => array('unlink_post_title_post')
		    )
		)
	    ),
	    array(
		'id' => 'unlink_post_title_post',
		'type' => 'toggle_switch',
		'label' => __('Unlink Post Title', 'themify'),
		'options' => 'simple'
	    ),
	    array(
		'id' => 'hide_post_date_post',
		'type' => 'toggle_switch',
		'label' => __('Post Date', 'themify'),
	    ),
	    array(
		'id' => 'hide_post_meta_post',
		'type' => 'toggle_switch',
		'label' => __('Post Meta', 'themify'),
	    ),
	    array(
		'id' => 'hide_page_nav_post',
		'type' => 'toggle_switch',
		'label' => __('Page Navigation', 'themify')
	    ),
	    array(
		'id' => 'css_post',
		'type' => 'custom_css'
	    ),
	    array('type' => 'custom_css_id')
	);
    }

    public function get_default_settings() {
	return array(
	    'layout_post' => 'grid4',
	    'post_per_page_post' => 4,
	    'display_post' => 'excerpt',
	    'hide_page_nav_post'=>'yes',
	    'post_type_post' => 'post'
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
			    self::get_color('', 'background_color_general', 'bg_c', 'background-color')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color('', 'b_c_g', 'bg_c', 'background-color', 'h')
			)
		    )
		))
	    )),
	    // Font
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_font_family('', 'font_family_general'),
			    self::get_color_type(array(' span', ' a:not(.post-edit-link)', ' p')),
			    self::get_font_size('', 'font_size_general'),
			    self::get_line_height('', 'line_height_general'),
			    self::get_letter_spacing(' .post'),
			    self::get_text_align('', 'text_align_general'),
			    self::get_text_transform('', 'text_transform_general'),
			    self::get_font_style('', 'font_general', 'font_bold'),
				self::get_text_shadow(),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_font_family('', 'f_f_g', 'h'),
			    self::get_color_type(array(' span', ' a:not(.post-edit-link)', ' p'), 'h'),
			    self::get_font_size('', 'f_s_g', '', 'h'),
			    self::get_line_height('', 'l_h_g', 'h'),
			    self::get_letter_spacing(' .post', 'l_s', 'h'),
			    self::get_text_align('', 't_a_g', 'h'),
			    self::get_text_transform('', 't_t_g', 'h'),
			    self::get_font_style('', 'f_g', 'f_b', 'h'),
				self::get_text_shadow('','t_sh','h'),
			)
		    )
		))
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_padding('', 'general_padding')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_padding('', 'g_p', 'h')
			)
		    )
		))
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_margin('', 'general_margin')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_margin('', 'g_m', 'h')
			)
		    )
		)),
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_border('', 'general_border')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_border('', 'g_b', 'h')
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

	$post_container = array(
	    // Background
	    self::get_expand('bg', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color(' .post', 'background_color', 'bg_c', 'background-color')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color(' .post', 'bg_c', 'bg_c', 'background-color', 'h')
			)
		    )
		))
	    )),
	    // Font
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_font_family(' .post'),
			    self::get_color(' .post', 'font_color'),
			    self::get_font_size(' .post'),
			    self::get_line_height(' .post'),
			    self::get_letter_spacing(' .post'),
			    self::get_text_align(' .post'),
			    self::get_text_transform(' .post'),
			    self::get_font_style(' .post'),
			    self::get_text_decoration(' .post', 'text_decoration_regular'),
				self::get_text_shadow(' .post','t_sh_p_c'),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_font_family(' .post', 'f_f', 'h'),
			    self::get_color(' .post', 'f_c', null,null, 'h'),
			    self::get_font_size(' .post', 'f_s', '', 'h'),
			    self::get_line_height(' .post', 'l_h', 'h'),
			    self::get_letter_spacing(' .post', 'l_s', 'h'),
			    self::get_text_align(' .post', 't_a', 'h'),
			    self::get_text_transform(' .post', 't_t', 'h'),
			    self::get_font_style(' .post', 'f_st', 'f_w', 'h'),
			    self::get_text_decoration(' .post', 't_d_r', 'h'),
				self::get_text_shadow(' .post','t_sh_p_c','h'),
			)
		    )
		))
	    )),
	    // Link
	    self::get_expand('l', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color(' a', 'link_color'),
			    self::get_text_decoration(' a')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color(' a', 'link_color',null, null, 'hover'),
			    self::get_text_decoration(' a', 't_d', 'h')
			)
		    )
		))
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_padding(' .post')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_padding(' .post', 'p', 'h')
			)
		    )
		))
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_heading_margin_multi_field(' .post', 'article', 'top'),
			    self::get_heading_margin_multi_field(' .post', 'article', 'bottom')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_heading_margin_multi_field(' .post', 'a', 'top', 'h'),
			    self::get_heading_margin_multi_field(' .post', 'a', 'bottom', 'h')
			)
		    )
		))
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_border(' .post')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_border(' .post', 'b', 'h')
			)
		    )
		))
	    )),
		// Rounded Corners
		self::get_expand('r_c', array(
				self::get_tab(array(
					'n' => array(
						'options' => array(
							self::get_border_radius(' .post', 'r_c_cn')
						)
					),
					'h' => array(
						'options' => array(
							self::get_border_radius(' .post', 'r_c_cn', 'h')
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
							self::get_box_shadow(' .post', 'sh_cn')
						)
					),
					'h' => array(
						'options' => array(
							self::get_box_shadow(' .post', 'sh_cn', 'h')
						)
					)
				))
			)
		),
	);

	$post_title = array(
	    // Font
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_font_family(array(' .post-title', ' .post-title a'), 'font_family_title'),
			    self::get_color(array(' .post-title', ' .post-title a'), 'font_color_title'),
			    self::get_font_size(' .post-title', 'font_size_title'),
				self::get_line_height(' .post-title', 'line_height_title'),
				self::get_letter_spacing(' .post-title', 'letter_spacing_title'),
			    self::get_text_transform(' .post-title', 'text_transform_title'),
			    self::get_font_style(' .post-title', 'font_style_title', 'font_weight_title'),
			    self::get_text_decoration(' .post-title', 'text_decoration_regular_title'),
				self::get_text_shadow(array(' .post-title', ' .post-title a'), 't_sh_t'),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_font_family(array(' .post-title', ' .post-title a'), 'f_f_t', 'h'),
			    self::get_color(array(' .post-title', ' .post-title a'), 'font_color_title', null, null, 'hover'),
			    self::get_font_size(' .post-title', 'f_s_t', '', 'h'),
				self::get_line_height(' .post-title', 'l_h_t', 'h'),
				self::get_letter_spacing(' .post-title', 'l_s_t', 'h'),
			    self::get_text_transform(' .post-title', 't_t_t', 'h'),
			    self::get_font_style(' .post-title', 'f_st_t', 'f_w_t', 'h'),
			    self::get_text_decoration(' .post-title', 't_d_r_t', 'h'),
				self::get_text_shadow(array(' .post-title', ' .post-title a'), 't_sh_t','h'),
			)
		    )
		))
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_padding(' .post-title', 'p_t')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_padding(' .post-title', 'p_t', 'h')
			)
		    )
		))
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_margin(' .post-title', 'm_t'),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_margin(' .post-title', 'm_t', 'h'),
			)
		    )
		))
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_border(' .post-title', 'b_t')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_border(' .post-title', 'b_t', 'h')
			)
		    )
		))
	    ))
	);


	$post_meta = array(
	    // Font
	    self::get_seperator('f'),
	    self::get_tab(array(
		'n' => array(
		    'options' => array(
			self::get_font_family(array(' .post-content .post-meta', ' .post-content .post-meta a', ' .post-date'), 'font_family_meta'),
			self::get_color(array(' .post-content .post-meta', ' .post-content .post-meta a', ' .post-date'), 'font_color_meta'),
			self::get_font_size(array(' .post-content .post-meta', ' .post-date'), 'font_size_meta'),
			self::get_line_height(array(' .post-content .post-meta', ' .post-date'), 'line_height_meta'),
			self::get_text_decoration(array(' .post-content .post-meta', ' .post-date'), 't_d_m'),
			self::get_text_shadow(array(' .post-content .post-meta', ' .post-content .post-meta a', ' .post-date'), 't_sh_m'),
		    )
		),
		'h' => array(
		    'options' => array(
			self::get_font_family(array(' .post-content .post-meta', ' .post-content .post-meta a', ' .post-date'), 'f_f_m', 'h'),
			self::get_color(array(' .post-content .post-meta', ' .post-content .post-meta a', ' .post-date'), 'font_color_meta',null,null,'hover'),
			self::get_font_size(array(' .post-content .post-meta', ' .post-date'), 'f_s_m', '', 'h'),
			self::get_line_height(array(' .post-content .post-meta', ' .post-date'), 'l_h_m', 'h'),
			self::get_text_decoration(array(' .post-content .post-meta', ' .post-date'), 't_d_m', 'h'),
			self::get_text_shadow(array(' .post-content .post-meta', ' .post-content .post-meta a', ' .post-date'), 't_sh_m','h'),
		    )
		)
	    ))
	);

	$post_date = array(
	    // Font
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_font_family(array(' .post .post-date', ' .post .post-date a'), 'font_family_date'),
			    self::get_color(array(' .post .post-date', ' .post .post-date a'), 'font_color_date'),
			    self::get_font_size(' .post .post-date', 'font_size_date'),
			    self::get_line_height(' .post .post-date', 'line_height_date'),
				self::get_text_shadow(array(' .post .post-date', ' .post .post-date a'), 't_sh_d'),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_font_family(array(' .post .post-date', ' .post .post-date a'), 'f_f_d', 'h'),
			    self::get_color(array(' .post .post-date', ' .post .post-date a'), 'f_c_d',null,null,'h'),
			    self::get_font_size(' .post .post-date', 'f_s_d', '', 'h'),
			    self::get_line_height(' .post .post-date', 'l_h_d', 'h'),
				self::get_text_shadow(array(' .post .post-date', ' .post .post-date a'), 't_sh_d','h'),
			)
		    )
		))
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_padding(' .post .post-date', 'p_d')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_padding(' .post .post-date', 'p_d', 'h')
			)
		    )
		))
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_margin(' .post .post-date', 'm_d'),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_margin(' .post .post-date', 'm_d', 'h'),
			)
		    )
		))
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_border(' .post .post-date', 'b_d')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_border(' .post .post-date', 'b_d', 'h')
			)
		    )
		))
	    ))
	);

	$post_content = array(
	    // Background
	    self::get_expand('bg', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color(' .post-content .entry-content', 'background_color_content', 'bg_c', 'background-color')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color(' .post-content .entry-content', 'b_c_c', 'bg_c', 'background-color', 'h')
			)
		    )
		))
	    )),
	    // Font
	    self::get_expand('f', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_font_family(' .post-content .entry-content', 'font_family_content'),
			    self::get_color(' .post-content .entry-content', 'font_color_content'),
			    self::get_font_size(' .post-content .entry-content', 'font_size_content'),
			    self::get_line_height(' .post-content .entry-content', 'line_height_content'),
			    self::get_text_align(' .post-content .entry-content', 't_a_c'),
				self::get_text_shadow(' .post-content .entry-content', 't_sh_c'),
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_font_family(' .post-content .entry-content', 'f_f_c','h'),
			    self::get_color(' .post-content .entry-content', 'f_c_c', null,null, 'h'),
			    self::get_font_size(' .post-content .entry-content', 'f_s_c', '', 'h'),
			    self::get_line_height(' .post-content .entry-content', 'l_h_c', 'h'),
			    self::get_text_align(' .post-content .entry-content', 't_a_c', 'h'),
				self::get_text_shadow(' .post-content .entry-content', 't_sh_c','h'),
			)
		    )
		))
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_padding(' .post-content .entry-content', 'c_p')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_padding(' .post-content .entry-content', 'c_p', 'h')
			)
		    )
		))
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_margin(' .post-content .entry-content', 'c_m')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_margin(' .post-content .entry-content', 'c_m', 'h')
			)
		    )
		))
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_border(' .post-content .entry-content', 'c_b')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_border(' .post-content .entry-content', 'c_b', 'h')
			)
		    )
		))
	    ))
	);

	$featured_image = array(
	    // Background
	    self::get_expand('bg', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_color(' .post-image', 'b_c_f_i', 'bg_c', 'background-color')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_color(' .post-image', 'b_c_f_i', 'bg_c', 'background-color', 'h')
			)
		    )
		))
	    )),
	    // Padding
	    self::get_expand('p', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_padding(' .post-image', 'p_f_i')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_padding(' .post-image', 'p_f_i', 'h')
			)
		    )
		))
	    )),
	    // Margin
	    self::get_expand('m', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_margin(' .post-image', 'm_f_i')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_margin(' .post-image', 'm_f_i', 'h')
			)
		    )
		))
	    )),
	    // Border
	    self::get_expand('b', array(
		self::get_tab(array(
		    'n' => array(
			'options' => array(
			    self::get_border(' .post-image', 'b_f_i')
			)
		    ),
		    'h' => array(
			'options' => array(
			    self::get_border(' .post-image', 'b_f_i', 'h')
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
		'co' => array(
		    'label' => __('Post Container', 'themify'),
		    'options' => $post_container
		),
		't' => array(
		    'label' => __('Post Title', 'themify'),
		    'options' => $post_title
		),
		'm' => array(
		    'label' => __('Post Meta', 'themify'),
		    'options' => $post_meta
		),
		'd' => array(
		    'label' => __('Post Date', 'themify'),
		    'options' => $post_date
		),
		'c' => array(
		    'label' => __('Post Content', 'themify'),
		    'options' => $post_content
		),
		'f' => array(
		    'label' => __('Featured Image', 'themify'),
		    'options' => $featured_image
		)
	    )
	);
    }

    /**
     * Render plain content for static content.
     * 
     * @param array $module 
     * @return string
     */
    public function get_plain_content($module) {
	return ''; // no static content for dynamic content
    }

}

///////////////////////////////////////
// Module Options
///////////////////////////////////////
Themify_Builder_Model::register_module('TB_Post_Module');

