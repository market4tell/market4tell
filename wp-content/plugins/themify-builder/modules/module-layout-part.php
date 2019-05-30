<?php

if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
/**
 * Module Name: Layout Part
 * Description: Layout Part Module
 */

class TB_Layout_Part_Module extends Themify_Builder_Component_Module {

    function __construct() {
        parent::__construct(array(
            'name' => __('Layout Part', 'themify'),
            'slug' => 'layout-part'
        ));
    }

    public function get_options() {
	global $Themify_Builder_Layouts;
        return array(
            array(
                'id' => 'mod_title_layout_part',
                'type' => 'title'
            ),
            array(
                'id' => 'selected_layout_part',
                'type' => 'layoutPart',
                'label' => __('Layout Part', 'themify'),
		'required' => array(
		    'message' => __("Please select a Layout Part. If you don't have any, add a new Layout Part", 'themify')
		),
		'add_url'=>add_query_arg('post_type', $Themify_Builder_Layouts->layout_part->post_type_name, admin_url('post-new.php')),
		'edit_url'=>add_query_arg('post_type', $Themify_Builder_Layouts->layout_part->post_type_name, admin_url('edit.php'))
            ),
            array(
                'id' => 'add_css_layout_part',
                'type' => 'custom_css'
            ),
            array('type'=>'custom_css_id')
        );
    }

    public function get_styling() {
        return array(
            'type' => 'tabs',
            'options' => array(
                'm_t' => array(
                    'options' => $this->module_title_custom_style()
                )
            )
        );
    }

    public function get_visual_type() {
        return 'ajax';
    }

    public function get_animation() {
        return false;
    }

}
///////////////////////////////////////
// Module Options
///////////////////////////////////////
Themify_Builder_Model::register_module('TB_Layout_Part_Module');
