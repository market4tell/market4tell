<?php

if ( !defined( 'ABSPATH' ) )
	exit; // Exit if accessed directly

/**
 * Module Name: Testimonials
 * Description: Display testimonial custom post type
 */
class TB_Testimonials_Module extends Themify_Builder_Component_Module {
	
	function __construct() {
		parent::__construct( array(
			'name' => __( 'Testimonials', 'themify' ),
			'slug' => 'testimonial-slider'
		) );
	}

	public function get_title( $module ){
		$type = isset( $module['mod_settings']['type_query_testimonial'] ) ? $module['mod_settings']['type_query_testimonial'] : 'category';
		$category = isset( $module['mod_settings']['category_testimonial'] ) ? $module['mod_settings']['category_testimonial'] : '';
		$slug_query = isset( $module['mod_settings']['query_slug_testimonial'] ) ? $module['mod_settings']['query_slug_testimonial'] : '';

		if ( 'category' === $type ) {
			return sprintf( '%s : %s', __( 'Category', 'themify' ), $category );
		} else {
			return sprintf( '%s : %s', __( 'Slugs', 'themify' ), $slug_query );
		}
	}

	public function get_options() {
	    return array(
		
		array(
		    'id' => 'mod_title_testimonial',
		    'type' => 'title'
		),
		array(
		    'id' => 'type_testimonial',
		    'type' => 'radio',
		    'label' => __('Type', 'themify'),
		    'options' => array(
			array('value' => 'slider', 'name' => __('Slider', 'themify')),
			array('value' => 'grid', 'name' => __('Grid', 'themify'))
		    ),
		    'option_js' => true
		),
		array(
		    'id' => 'grid_layout_testimonial',
		    'type' => 'layout',
		    'label' => __('Grid Layout', 'themify'),
		    'mode' => 'sprite',
		    'options' => array(
			array('img' => 'list_post', 'value' => 'list-post', 'label' => __('List Post', 'themify')),
			array('img' => 'grid2', 'value' => 'grid2', 'label' => __('Grid 2', 'themify')),
			array('img' => 'grid3', 'value' => 'grid3', 'label' => __('Grid 3', 'themify')),
			array('img' => 'grid4', 'value' => 'grid4', 'label' => __('Grid 4', 'themify')),
		    ),
		    'control' => array(
			'classSelector' => '.themify_builder_testimonial'
		    ),
		    'wrap_class' => 'tb_group_element_grid'
		),
		array(
		    'id' => 'layout_testimonial',
		    'type' => 'layout',
		    'label' => __('Layout', 'themify'),
		    'mode' => 'sprite',
		    'options' => array(
			array('img' => 'testimonials_image_top', 'value' => 'image-top', 'label' => __('Image Top', 'themify')),
			array('img' => 'testimonials_image_bottom', 'value' => 'image-bottom', 'label' => __('Image Bottom', 'themify')),
			array('img' => 'testimonials_image_bubble', 'value' => 'image-bubble', 'label' => __('Image Bubble', 'themify'))
		    ),
		    'control' => array(
			'classSelector' => ''
		    )
		),
		array(
		    'id' => 'img_w_slider',
		    'type' => 'text',
		    'label' => __('Image Width', 'themify'),
		    'class' => 'xsmall',
		    'after' => 'px'
		),
		array(
		    'id' => 'img_h_slider',
		    'type' => 'text',
		    'label' => __('Image Height', 'themify'),
		    'class' => 'xsmall',
		    'after' => 'px'
		),
		array(
		    'id' => 'tab_content_testimonial',
		    'type' => 'builder',
		    'options' => array(
			array(
			    'id' => 'title_testimonial',
			    'type' => 'text',
			    'label' => __('Testimonial Title', 'themify'),
			    'class' => 'fullwidth',
			    'control' => array(
				'selector' => '.testimonial-title'
			    )
			),
			array(
			    'id' => 'content_testimonial',
			    'type' => 'wp_editor',
			    'rows' => 6
			),
			array(
			    'id' => 'person_picture_testimonial',
			    'type' => 'image',
			    'label' => __('Person Picture', 'themify')
			),
			array(
			    'id' => 'person_name_testimonial',
			    'type' => 'text',
			    'label' => __('Person Name', 'themify'),
			    'class' => 'fullwidth',
			    'control' => array(
				'selector' => '.person-name'
			    )
			),
			array(
			    'id' => 'person_position_testimonial',
			    'type' => 'text',
			    'label' => __('Person Position', 'themify'),
			    'class' => 'fullwidth',
			    'control' => array(
				'selector' => '.person-position'
			    )
			),
			array(
			    'id' => 'company_testimonial',
			    'type' => 'text',
			    'label' => __('Company', 'themify'),
			    'class' => 'fullwidth',
			    'control' => array(
				'selector' => '.person-company'
			    )
			),
			array(
			    'id' => 'company_website_testimonial',
			    'type' => 'text',
			    'label' => __('Company Website', 'themify'),
			    'class' => 'fullwidth'
			)
		    )
		),
		array(
		    'id' => 'slider_option_testimonial',
		    'type' => 'slider',
		    'label' => __('Slider Options', 'themify'),
		    'wrap_class' => 'tb_group_element_slider',
		    'slider_options' => true
		),
		array(
		    'id' => 'css_testimonial',
		    'type' => 'custom_css'
		),
		array('type' => 'custom_css_id')
	    );
	}

    public function get_default_settings(){
		return array(
			'layout_testimonial' => 'image-top',
			'img_h_slider' => 100,
			'img_w_slider' => 100,
			'visible_opt_slider' => 1,
			'auto_scroll_opt_slider' => 'off',
			'tab_content_testimonial' => array(
				array(
					'title_testimonial' => esc_html__( 'Optional Title', 'themify' ),
					'content_testimonial' => esc_html__( 'Testimonial content', 'themify' ),
					'person_name_testimonial' => 'John Smith',
					'person_position_testimonial' => 'CEO',
					'company_testimonial' => 'X-corporation'
				)
			)
		);
	}

	public function get_visual_type(){
		return 'ajax';
	}

	public function get_styling(){

		$general = array(
			// Background
			self::get_expand( 'bg', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_color( '', 'background_color', 'bg_c', 'background-color' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_color( '', 'bg_c', 'bg_c', 'background-color', 'h' )
						)
					)
				) )
			) ),
			// Font
			self::get_expand( 'f', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_font_family(),
							self::get_color_type( array( ' .tb_text_wrap', ' .testimonial-title', ' .person-name', ' .person-position', ' .person-company', ' .person-company a' ) ),
							self::get_font_size(),
							self::get_line_height(),
							self::get_letter_spacing(),
							self::get_text_align(),
							self::get_text_transform(),
							self::get_font_style(),
							self::get_text_decoration( '', 'text_decoration_regular' ),
							self::get_text_shadow(),
						)
					),
					'h' => array(
						'options' => array(
							self::get_font_family( '', 'f_f', 'h' ),
							self::get_color_type( array( ':hover .tb_text_wrap', ':hover .testimonial-title', ':hover .person-name', ':hover .person-position', ':hover .person-company', ':hover .person-company a' ), '', 'f_c_t_h', 'f_c_h', 'f_g_c_h' ),
							self::get_font_size( '', 'f_s', 'h' ),
							self::get_line_height( '', 'l_h', 'h' ),
							self::get_letter_spacing( '', 'l_s', 'h' ),
							self::get_text_align( '', 't_a', 'h' ),
							self::get_text_transform( '', 't_t', 'h' ),
							self::get_font_style( '', 'f_st', 'f_w', 'h' ),
							self::get_text_decoration( '', 't_d_r', 'h' ),
							self::get_text_shadow( '', 't_sh', 'h' ),
						)
					)
				) )
			) ),
			// Link
			self::get_expand( 'l', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_color( ' a', 'link_color' ),
							self::get_text_decoration( ' a' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_color( ' a', 'link_color', null, null, 'hover' ),
							self::get_text_decoration( ' a', 't_d', 'h' )
						)
					)
				) )
			) ),
			// Padding
			self::get_expand( 'p', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_padding()
						)
					),
					'h' => array(
						'options' => array(
							self::get_padding( '', 'p', 'h' )
						)
					)
				) )
			) ),
			// Margin
			self::get_expand( 'm', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_margin()
						)
					),
					'h' => array(
						'options' => array(
							self::get_margin( '', 'm', 'h' )
						)
					)
				) )
			) ),
			// Border
			self::get_expand( 'b', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_border()
						)
					),
					'h' => array(
						'options' => array(
							self::get_border( '', 'b', 'h' )
						)
					)
				) )
			) ),
			// Filter
			self::get_expand( 'f_l', array( self::get_blend() ) ),
			// Rounded Corners
			self::get_expand( 'r_c', array(
					self::get_tab( array(
						'n' => array(
							'options' => array(
								self::get_border_radius()
							)
						),
						'h' => array(
							'options' => array(
								self::get_border_radius( '', 'r_c', 'h' )
							)
						)
					) )
				)
			),
			// Shadow
			self::get_expand( 'sh', array(
					self::get_tab( array(
						'n' => array(
							'options' => array(
								self::get_box_shadow()
							)
						),
						'h' => array(
							'options' => array(
								self::get_box_shadow( '', 'sh', 'h' )
							)
						)
					) )
				)
			),
		);

		$testimonial_title = array(
			// Font
			self::get_seperator( 'f' ),
			self::get_tab( array(
				'n' => array(
					'options' => array(
						self::get_font_family( ' .testimonial-title', 'font_family_title' ),
						self::get_color( '.module .testimonial-title', 'font_color_title' ),
						self::get_font_size( ' .testimonial-title', 'font_size_title' ),
						self::get_line_height( ' .testimonial-title', 'line_height_title' ),
						self::get_letter_spacing( ' .testimonial-title', 'letter_spacing_title' ),
						self::get_text_transform( ' .testimonial-title', 'text_transform_title' ),
						self::get_font_style( ' .testimonial-title', 'font_style_title', 'font_title_bold' ),
						self::get_text_shadow( ' .testimonial-title', 't_sh_t' ),
					)
				),
				'h' => array(
					'options' => array(
						self::get_font_family( ' .testimonial-title', 'f_f_t', 'h' ),
						self::get_color( '.module .testimonial-title', 'f_c_t', null, null, 'h' ),
						self::get_font_size( ' .testimonial-title', 'f_s_t', '', 'h' ),
						self::get_line_height( ' .testimonial-title', 'l_h_t', 'h' ),
						self::get_letter_spacing( ' .testimonial-title', 'l_s_t', 'h' ),
						self::get_text_transform( ' .testimonial-title', 't_t_t', 'h' ),
						self::get_font_style( ' .testimonial-title', 'f_st_t', 'f_t_b', 'h' ),
						self::get_text_shadow( ' .testimonial-title', 't_sh_t', 'h' ),
					)
				)
			) )
		);

		$testimonial_content = array(
			// Background
			self::get_expand( 'bg', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_color( ' .testimonial-entry-content', 'background_color_content', 'bg_c', 'background-color' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_color( ' .testimonial-entry-content', 'b_c_c', 'bg_c', 'background-color', 'h' )
						)
					)
				) )
			) ),
			// Font
			self::get_expand( 'f', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_font_family( ' .testimonial-entry-content', 'font_family_content' ),
							self::get_color( '.module .tb_text_wrap', 'font_color_content' ),
							self::get_font_size( ' .testimonial-entry-content', 'font_size_content' ),
							self::get_line_height( ' .testimonial-entry-content', 'line_height_content' ),
							self::get_text_shadow( ' .testimonial-entry-content', 't_sh_c' ),
						)
					),
					'h' => array(
						'options' => array(
							self::get_font_family( ' .testimonial-entry-content', 'f_f_c', 'h' ),
							self::get_color( '.module .tb_text_wrap', 'f_c_c', null, null, 'h' ),
							self::get_font_size( ' .testimonial-entry-content', 'f_s_c', '', 'h' ),
							self::get_line_height( ' .testimonial-entry-content', 'l_h_c', 'h' ),
							self::get_text_shadow( ' .testimonial-entry-content', 't_sh_c', 'h' ),
						)
					)
				) )
			) ),
			// Padding
			self::get_expand( 'p', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_padding( ' .testimonial-entry-content', 'content_padding' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_padding( ' .testimonial-entry-content', 'c_p', 'h' )
						)
					)
				) )
			) ),
			// Border
			self::get_expand( 'b', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_border( ' .testimonial-entry-content', 'content_border' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_border( ' .testimonial-entry-content', 'c_b', 'h' )
						)
					)
				) )
			) )
		);

		$testimonial_container = array(
			// Background
			self::get_expand( 'bg', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_color(array(' .testimonial-image', ' .testimonial-content'),'b_c_container', 'bg_c', 'background-color' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_color( array(':hover .testimonial-image', ':hover .testimonial-content'), 'b_c_co', 'bg_c', 'background-color' )
						)
					)
				) )
			) ),
			// Padding
			self::get_expand( 'p', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_padding( ' .testimonial-content', 'p_container' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_padding( ' .testimonial-content', 'p_c', 'h' )
						)
					)
				) )
			) ),
			// Border
			self::get_expand( 'b', array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_border( ' .testimonial-content', 'b_container' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_border( ' .testimonial-content', 'b_co', 'h' )
						)
					)
				) )
			) )
		);

		$person_info = array(
			// Font
			self::get_expand( __( 'Person Name Font', 'themify' ), array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_font_family( '.module .person-name', 'font_family_person_name' ),
							self::get_color( '.module .person-name', 'font_color_person_name' ),
							self::get_font_size( '.module .person-name', 'font_size_person_name' ),
							self::get_line_height( '.module .person-name', 'line_height_person_name' ),
							self::get_text_transform( '.module .person-name', 'text_transform_person_name' ),
							self::get_font_style( '.module .person-name', 'font_style_person_name' ),
							self::get_text_shadow( '.module .person-name', 't_sh_i' ),
						)
					),
					'h' => array(
						'options' => array(
							self::get_font_family( '.module .person-name', 'f_f_p_n', 'h' ),
							self::get_color( '.module .person-name', 'f_c_p_n', null, null, 'h' ),
							self::get_font_size( '.module .person-name', 'f_s_p_n', '', 'h' ),
							self::get_line_height( '.module .person-name', 'l_h_p_n', 'h' ),
							self::get_text_transform( '.module .person-name', 't_t_p_n', 'h' ),
							self::get_font_style( '.module .person-name', 'f_st_p_n', 'f_w_p_n', 'h' ),
							self::get_text_shadow( '.module .person-name', 't_sh_i', 'h' ),
						)
					)
				) )
			) ),
			// Font
			self::get_expand( __( 'Person Position Font', 'themify' ), array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_font_family( '.module .person-position', 'font_family_person_position' ),
							self::get_color( '.module .person-position', 'font_color_person_position' ),
							self::get_font_size( '.module .person-position', 'font_size_person_position' ),
							self::get_line_height( '.module .person-position', 'line_height_person_position' ),
							self::get_text_transform( '.module .person-position', 'text_transform_person_position' ),
							self::get_font_style( '.module .person-position', 'font_style_person_position' ),
							self::get_text_shadow( '.module .person-position', 't_sh_p_i' ),
						)
					),
					'h' => array(
						'options' => array(
							self::get_font_family( '.module .person-position', 'f_f_p_p', 'h' ),
							self::get_color( '.module .person-position', 'f_c_p_p', null, null, 'h' ),
							self::get_font_size( '.module .person-position', 'f_s_p_p', '', 'h' ),
							self::get_line_height( '.module .person-position', 'l_h_p_p', 'h' ),
							self::get_text_transform( '.module .person-position', 't_t_p_p', 'h' ),
							self::get_font_style( '.module .person-position', 'f_st_p_p', 'f_w_p_p', 'h' ),
							self::get_text_shadow( '.module .person-position', 't_sh_p_i', 'h' ),
						)
					)
				) )
			) ),
			// Font
			self::get_expand( __( 'Person Company Font', 'themify' ), array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_font_family( '.module .person-company', 'font_family_company' ),
							self::get_color( '.module .person-company', 'font_color_company' ),
							self::get_font_size( '.module .person-company', 'font_size_company' ),
							self::get_line_height( '.module .person-company', 'line_height_company' ),
							self::get_text_transform( '.module .person-company', 'text_transform_company' ),
							self::get_font_style( '.module .person-company', 'font_style_company' ),
							self::get_text_shadow( '.module .person-company', 't_sh_p_c' ),
						)
					),
					'h' => array(
						'options' => array(
							self::get_font_family( '.module .person-company', 'f_f_c', 'h' ),
							self::get_color( '.module .person-company', 'f_c_c', null, null, 'h' ),
							self::get_font_size( '.module .person-company', 'f_s_c', '', 'h' ),
							self::get_line_height( '.module .person-company', 'l_h_c', 'h' ),
							self::get_text_transform( '.module .person-company', 't_t_c', 'h' ),
							self::get_font_style( '.module .person-company', 'f_st_c', 'f_w_c', 'h' ),
							self::get_text_shadow( '.module .person-company', 't_sh_p_c', 'h' ),
						)
					)
				) )
			) )
		);

		$controls = array(
			// Arrows
			self::get_expand( __( 'Arrows', 'themify' ), array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_color( array( ' .carousel-prev', ' .carousel-next' ), 'background_color_arrows_controls', 'bg_c', 'background-color' ),
							self::get_color( array( ' .carousel-prev::before', ' .carousel-next::before' ), 'font_color_arrows_controls' ),

						)
					),
					'h' => array(
						'options' => array(
							self::get_color( array( ' .carousel-prev:hover', ' .carousel-next:hover' ), 'background_color_hover_arrows_controls', 'bg_c', 'background-color' ),
							self::get_color( array( ' .carousel-prev:hover::before', ' .carousel-next:hover::before' ), 'font_color_arrows_controls_hover' )
						)
					)
				) )
			) ),
			// Pager
			self::get_expand( __( 'Pager', 'themify' ), array(
				self::get_tab( array(
					'n' => array(
						'options' => array(
							self::get_color( ' .carousel-pager a', 'font_color_pager_controls' )
						)
					),
					'h' => array(
						'options' => array(
							self::get_color( array( ' .carousel-pager a:hover', ' .carousel-pager a.selected' ), 'font_color_hover_pager_controls' )
						)
					)
				) )
			) )
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
					'label' => __( 'Testimonial Container', 'themify' ),
					'options' => $testimonial_container
				),
				't' => array(
					'label' => __( 'Testimonial Title', 'themify' ),
					'options' => $testimonial_title
				),
				'c' => array(
					'label' => __( 'Testimonial Content', 'themify' ),
					'options' => $testimonial_content
				),
				'p' => array(
					'label' => __( 'Person Info', 'themify' ),
					'options' => $person_info
				),
				'a' => array(
					'label' => __( 'Slider Controls', 'themify' ),
					'options' => $controls
				)
			)
		);

	}
}

///////////////////////////////////////
// Module Options
///////////////////////////////////////

Themify_Builder_Model::register_module( 'TB_Testimonials_Module' );

