<?php

class Themify_Builder_Component_Row extends Themify_Builder_Component_Base {

    public function get_name() {
	return 'row';
    }

    private function get_settings() {

	return apply_filters('themify_builder_row_fields_options', array(
	    // Row Width
	    array(
		'id' => 'row_width',
		'label' => __('Row Width', 'themify'),
		'type' => 'layout',
		'mode' => 'sprite',
		'options' => array(
		    array('img' => 'row_default', 'value' => '', 'label' => __('Default', 'themify')),
		    array('img' => 'row_fullwidth', 'value' => 'fullwidth', 'label' => __('Boxed', 'themify')),
		    array('img' => 'row_fullwidth_content', 'value' => 'fullwidth-content', 'label' => __('Fullwidth', 'themify'))
		)
	    ),
	    // Row Height
	    array(
		'id' => 'row_height',
		'label' => __('Row Height', 'themify'),
		'type' => 'layout',
		'mode' => 'sprite',
		'options' => array(
		    array('img' => 'row_default', 'value' => '', 'label' => __('Default', 'themify')),
		    array('img' => 'row_fullheight', 'value' => 'fullheight', 'label' => __('Full Height', 'themify'))
		),

	    ),
	    array(
		'id' => 'custom_css_row',
		'type' => 'custom_css'
	    ),
	    array(
		'id' => 'row_anchor',
		'type' => 'row_anchor',
		'label' => __('Row Anchor', 'themify'),
		'class' => 'large',
		'help'	=> __('Example: enter ‘about’ as row anchor and add ‘#about’ link in menu link. When the link is clicked, it will scroll to this row(<a href="https://themify.me/docs/builder#scrollto-row-anchor"  target="_blank">learn more</a>).', 'themify')
	    ),
	    array('type' => 'custom_css_id')
	));
    }

    public function get_form_settings($onlyStyle=false) {
	$styles = $this->get_styling();
	if($onlyStyle===true){
	    return $styles;
	}
	$row_form_settings = array(
	    'setting' => array(
		'name' => __('Row Options', 'themify'),
		'options' => $this->get_settings()
	    ),
	    'styling' => array(
		'options' => $styles
	    ),
	    'visibility' => true,
	    'animation' => true
	);
	return apply_filters('themify_builder_row_lightbox_form_settings', $row_form_settings);
    }

    /**
     * Get template row
     *
     * @param array  $rows
     * @param array  $row
     * @param string $builder_id
     * @param bool   $echo
     *
     * @return string
     */
    public static function template($rows, $row, $builder_id, $echo = false) {
	// prevent empty rows from being rendered
	$count = !Themify_Builder::$frontedit_active && isset($row['cols']) ? count($row['cols']) : 0;
	if (($count === 0 && !isset($row['styling']) ) || ($count === 1 && empty($row['cols'][0]['modules']) && empty($row['cols'][0]['styling']) && empty($row['styling']) ) // there's only one column and it's empty
	) {
	    return '';
	}
	if (!Themify_Builder::$frontedit_active) {
	    /* allow addons to control the display of the rows */
	    $display = apply_filters('themify_builder_row_display', true, $row, $builder_id);
	    if (false === $display || (isset($row['styling']['visibility_all']) && $row['styling']['visibility_all'] === 'hide_all' )) {
		return false;
	    }
	}
	$row['row_order'] = isset($row['row_order']) ? $row['row_order'] : '';
	$row_classes = array('themify_builder_row module_row', 'clearfix');
	$row_attributes = array();
	$is_styling = !empty($row['styling']);
	$video_data = '';
	if ($is_styling) {
	    // @backward-compatibility
	    if (!isset($row['styling']['background_type']) && !empty($row['styling']['background_video'])) {
		$row['styling']['background_type'] = 'video';
		} elseif ( ( empty($row['styling']['background_type']) || (isset($row['styling']['background_type']) && $row['styling']['background_type'] === 'image' )) && isset($row['styling']['background_zoom']) && $row['styling']['background_zoom'] === 'zoom' && $row['styling']['background_repeat'] === 'repeat-none') {
		$row_classes[] = 'themify-bg-zoom';
	    }
	    $class_fields = array('custom_css_row', 'background_repeat', 'animation_effect', 'row_height', 'hover_animation_effect','animation_effect_delay','animation_effect_repeat');
	    $is_active = !Themify_Builder::$frontedit_active && Themify_Builder_Model::is_animation_active();
	    foreach ($class_fields as $field) {
		if (!empty($row['styling'][$field])) {
		    if ('animation_effect' === $field || 'hover_animation_effect' === $field || 'animation_effect_delay' === $field || 'animation_effect_repeat' === $field) {
			if($is_active===true){
			    if('animation_effect' === $field){
				$row_classes[] = 'wow';
				$row_classes[] = $row['styling'][$field];
			    }
			    else if('animation_effect_delay' === $field){
				if(!empty($row['styling']['animation_effect'])){
				    $row_classes[] = 'animation_effect_delay_' . $row['styling'][$field];
				}
			    }
			    else if('animation_effect_repeat' === $field){
				if(!empty($row['styling']['animation_effect'])){
				    $row_classes[] = 'animation_effect_repeat_' . $row['styling'][$field];
				}
			    }
			    else{
				$row_classes[] = 'hover-wow hover-animation-' . $row['styling'][$field];
			    }
			}
		    } else {
			$row_classes[] = $row['styling'][$field];
		    }
		}
	    }
	    /**
	     * Row Width class
	     * To provide backward compatibility, the CSS classname and the option label do not match. See #5284
	     */
	    if (isset($row['styling']['row_width'])) {
		if ('fullwidth' === $row['styling']['row_width']) {
		    $row_classes[] = 'fullwidth_row_container';
		} elseif ('fullwidth-content' === $row['styling']['row_width']) {
		    $row_classes[] = 'fullwidth';
		}
		$breakpoints = themify_get_breakpoints(null, true);
		$breakpoints['desktop'] = 1;
		$prop = 'fullwidth' === $row['styling']['row_width'] ? 'padding' : 'margin';
		foreach ($breakpoints as $k => $v) {
		    $styles = $k === 'desktop' ? $row['styling'] : (!empty($row['styling']['breakpoint_' . $k]) ? $row['styling']['breakpoint_' . $k] : false);
		    if ($styles) {
			$val = self::getDataValue($styles, $prop);
			if ($val) {
			    $row_attributes['data-' . $k . '-' . $prop] = $val;
			}
		    }
		}
	    }
	    // background video
	    $video_data = self::get_video_background($row['styling']);
	    // Class for Scroll Highlight
	    if (!empty($row['styling']['row_anchor'])) {
		$row_classes[] = 'tb_section-' . $row['styling']['row_anchor'];
		$row_attributes['data-anchor'] = $row['styling']['row_anchor'];

	    }
	}

	if (!$echo) {
	    $output = PHP_EOL; // add line break
	    ob_start();
	}
	if (!Themify_Builder::$frontedit_active) {
	    $row_content_classes = array();
	    if($row['row_order']!==''){
		$row_classes[] = 'module_row_' . $row['row_order'] . ' themify_builder_' . $builder_id . '_row module_row_' . $builder_id . '-' . $row['row_order'];
	    }
	    // Set column alignment
	    $row_content_classes[] = !empty($row['column_alignment']) ? $row['column_alignment'] : (function_exists('themify_theme_is_fullpage_scroll') && themify_theme_is_fullpage_scroll() ? 'col_align_middle' : 'col_align_top');
	    if (!empty($row['gutter']) && $row['gutter'] !== 'gutter-default') {
		$row_content_classes[] = $row['gutter'];
	    }
	    if (!empty($row['column_h'])) {
		$row_content_classes[] = 'col_auto_height';
	    }
	    if ($count > 0) {
		$row_content_attr = self::get_directions_data($row, $count);
		$order_classes = self::get_order($count);
		$is_phone = themify_is_touch('phone');
		$is_tablet = !$is_phone && themify_is_touch('tablet');
		$is_right = false;
		if ($is_tablet) {
		    $is_right = isset($row_content_attr['data-tablet_dir']) || isset($row_content_attr['data-tablet_landscape_dir']);
		    if (isset($row_content_attr['data-col_tablet']) || isset($row_content_attr['data-col_tablet_landscape'])) {
			$row_content_classes[] = isset($row_content_attr['data-col_tablet_landscape']) ? $row_content_attr['data-col_tablet_landscape'] : $row_content_attr['data-col_tablet'];
		    }
		} elseif ($is_phone) {
		    $is_right = isset($row_content_attr['data-mobile_dir']);
		    if (isset($row_content_attr['data-col_mobile'])) {
			$row_content_classes[] = $row_content_attr['data-col_mobile'];
		    }
		} else {
		    $is_right = isset($row_content_attr['data-desktop_dir']);
		}
		if ($is_right) {
		    $row_content_classes[] = 'direction-rtl';
		    $order_classes = array_reverse($order_classes);
		}
	    }
	    $row_content_classes = implode(' ', $row_content_classes);
	    if (isset($row['element_id'])) {
		$row_classes[] = 'tb_'.$row['element_id'];
	    }
	    if($is_styling){
		$row_attributes = self::sticky_element_props($row_attributes,$row['styling']);
	    }
	}
	$row_classes = apply_filters('themify_builder_row_classes', $row_classes, $row, $builder_id);
	$row_attributes['class'] = implode(' ', $row_classes);
	$row_attributes = apply_filters('themify_builder_row_attributes', $row_attributes, $is_styling ? $row['styling'] : array(), $builder_id);



	do_action('themify_builder_row_start', $builder_id, $row, $row['row_order']);

	echo (strpos($row_attributes['class'], 'tb-page-break') !== false) ? '<!-- tb_page_break -->' : '';
	?>

	<!-- module_row -->
	<div <?php echo $video_data, self::get_element_attributes($row_attributes); ?>>
	    <?php
	    if ($is_styling) {
		do_action('themify_builder_background_styling', $builder_id, $row, $row['row_order'], 'row');
		self::background_styling($row, 'row');
		self::show_frame($row['styling']);
	    }
	    ?>
	    <div class="row_inner<?php if (!Themify_Builder::$frontedit_active): ?> <?php echo $row_content_classes ?><?php endif; ?>" <?php if (!empty($row_content_attr)): ?> <?php echo self::get_element_attributes($row_content_attr); ?><?php endif; ?>>
		<?php
		if ($count > 0) {
		    foreach ($row['cols'] as $cols => $col) {
			Themify_Builder_Component_Column::template($rows, $row, $cols, $col, $builder_id, $order_classes, true);
		    }
		}
		?>
	    </div>
	    <!-- /row_inner -->
	</div>
	<!-- /module_row -->
	<?php
	do_action('themify_builder_row_end', $builder_id, $row, $row['row_order']);
	if (!$echo) {
	    $output .= ob_get_clean();
	    // add line break
	    $output .= PHP_EOL;
	    return $output;
	}
    }

    private static function getDataValue($styles, $type = 'padding') {
	$value = '';
	if (!empty($styles['checkbox_' . $type . '_apply_all']) && !empty($styles[$type . '_top'])) {
	    $value = $styles[$type . '_top'];
	    $value.= isset($styles[$type . '_top_unit']) ? $styles[$type . '_top_unit'] : 'px';
	    $value = $value . ',' . $value;
	} elseif (!empty($styles[$type . '_left']) || !empty($styles[$type . '_right'])) {
	    if (!empty($styles[$type . '_left'])) {
		$value = $styles[$type . '_left'];
		$value.= isset($styles[$type . '_left_unit']) ? $styles[$type . '_left_unit'] : 'px';
	    }
	    $value.=',';
	    if (!empty($styles[$type . '_right'])) {
		$value.= $styles[$type . '_right'];
		$value.= isset($styles[$type . '_right_unit']) ? $styles[$type . '_right_unit'] : 'px';
	    }
	}
	return $value;
    }

}
