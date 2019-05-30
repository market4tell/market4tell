<?php

class Themify_Builder_Stylesheet {

    public static $generateStyles = array();
    private static  $ids = array();
    /**
     * Constructor
     * 
     * @access public
     * @param object Themify_Builder $builder 
     */
    public static function init() {
        if (defined('DOING_AJAX')) {
            add_action('wp_ajax_tb_slider_live_styling', array(__CLASS__, 'slider_live_styling'), 10);
        } else if(!is_admin()){
	    if(!Themify_Builder_Model::is_front_builder_activate()){
		add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue_stylesheet'), 14);
		add_filter('themify_google_fonts', array(__CLASS__, 'enqueue_fonts'));
	    }
            add_action('themify_builder_before_template_content_render', array(__CLASS__, 'enqueue_stylesheet'), 10);
        }
    }
    


    /**
     * Checks if the builder stylesheet exists and enqueues it.
     * 
     * @since 2.2.5
     * 
     * @return bool True if enqueue was successful, false otherwise.
     */
    public static function enqueue_stylesheet( $return = false, $post_id = null ) {
		$stylesheet_path = self::get_stylesheet( 'bydir', $post_id );
		if (!self::is_readable_and_not_empty( $stylesheet_path ) ) {
		    $id = Themify_Builder_Model::get_ID();
		    if(!isset(self::$generateStyles[$id])){
			self::$generateStyles[$id] = true;
			$post_data = $GLOBALS['ThemifyBuilder_Data_Manager']->get_data($id);
		
			if($post_data){
			    static $strucutre =null;
			    if($strucutre===null){
				$strucutre = true;
				Themify_Builder_Component_Module::load_modules();
				wp_enqueue_script('tb_builder_js_style',themify_enque(THEMIFY_URI.'/js/generate-style.js'),null,THEMIFY_VERSION,true);
				
				wp_localize_script('tb_builder_js_style', 'ThemifyBuilderStyle', array(
					    'styles'=>Themify_Builder::getComponentJson(true),
					    'points'=>themify_get_breakpoints(),
					    'nonce'=>wp_create_nonce('tb_load_nonce'),
					    'ajaxurl'=>admin_url('admin-ajax.php'),
					    'google'=>themify_get_google_web_fonts_list()
				));
			    }
			    $post_data = self::reSaveData($post_data);
			    $GLOBALS['ThemifyBuilder_Data_Manager']->save_data($post_data, $id);
			    wp_localize_script('tb_builder_js_style', 'themify_builder_data_'.$id, $post_data);
			}
		    }
		}
		else{
		    setlocale( LC_CTYPE, get_locale() . '.UTF-8' );
		    $handler = pathinfo( $stylesheet_path );
		    $version = filemtime( $stylesheet_path );
		    $url = themify_https_esc( self::get_stylesheet( 'byurl', $post_id ) );

		    if( $return ) {
			    return array(
				'handler' => $handler['filename'],
				'url' => $url . '?ver=' . $version
			    );
		    } else {

			wp_enqueue_style( $handler['filename'], $url, array(), $version);
		    }

		    return true;
		}
		return false;
	}
	
	private  static function reSaveData($data){
	    foreach($data as &$r){
		if(isset($r['cid'])){
		    unset($r['cid']);
		}
		if(!isset($r['element_id'])){
		    $r['element_id'] = Themify_Builder_Model::generateID();
		}
		$r['element_id'] = self::checkUniqId($r['element_id']);
		if (!empty($r['cols'])) {
		    foreach($r['cols'] as &$c){
			if(!isset($c['element_id'])){
			    $c['element_id'] = Themify_Builder_Model::generateID();
			}
			$c['element_id'] = self::checkUniqId($c['element_id']);
			if(isset($c['cid'])){
			    unset($c['cid']);
			}
			if (!empty($c['modules'])) {
			    foreach($c['modules'] as &$m){
				if(!isset($m['element_id'])){
				    $m['element_id'] = Themify_Builder_Model::generateID();
				}
				$m['element_id'] = self::checkUniqId($m['element_id']);
				if(isset($m['mod_settings']['cid'])){
				    unset($m['mod_settings']['cid']);
				}
				if (!empty($m['cols'])) {
				    foreach ($m['cols'] as &$sub_col) {
					if(!isset($sub_col['element_id'])){
					    $sub_col['element_id'] = Themify_Builder_Model::generateID();
					}
					$sub_col['element_id'] = self::checkUniqId($sub_col['element_id']);
					if(isset($sub_col['cid'])){
					    unset($sub_col['cid']);
					}
					if (!empty($sub_col['modules'])) {
					    foreach ($sub_col['modules'] as &$sub_m) {
						if(!isset($sub_m['element_id'])){
						    $sub_m['element_id'] = Themify_Builder_Model::generateID();
						}
						$sub_m['element_id'] = self::checkUniqId($sub_m['element_id']);
						if(isset($sub_m['mod_settings']['cid'])){
						    unset($sub_m['mod_settings']['cid']);
						}
					    }
					}
				    }
				}
			    }
			}
		    }
		}
	    }
	    self::$ids = array();
	    return $data;
	}
	
	private static function checkUniqId($id){
	    while(isset(self::$ids[$id])){
		$id = Themify_Builder_Model::generateID();
	    }
	    self::$ids[$id] = true;
	    return $id;
	}

    /**
     * Write stylesheet file.
     * 
     * @since 2.2.5
     * 
     * @return array
     */
    public static function write_stylesheet($style_id,$data) {
        // Information about how writing went.
        $results = array();
	$breakpoints = themify_get_breakpoints();
	$css='';
	$fonts = array();
	$breakpoints = array('desktop'=>'')+$breakpoints;
	foreach($breakpoints as $b=>$bpoint){
	    if(!empty($data[$b]) ){
		$styles='';
		foreach($data[$b] as  $selector=>$arr){
			$styles.=$selector.'{'.implode(' ',$arr).'}'.PHP_EOL;
		}
		if($b!=='desktop'){
		    $max = is_array($bpoint)?$bpoint[1]:$bpoint;
		    $styles=PHP_EOL.sprintf('@media screen and (max-width: %spx) {', $max).PHP_EOL.$styles.'}';
		}
		$css.=$styles;
		unset($data[$b]);
	    }
	}
	if(!empty($data['fonts'])){
	    foreach($data['fonts'] as $f=>$w){
		$v =str_replace(' ', '+', $f );
		if(!empty($w)){
			$v.=':'.implode(',',$w);
		}
		$fonts[]=$v;
	    }
	}
	unset($data);
        $css_file = self::get_stylesheet('bydir', $style_id);
        $filesystem = Themify_Filesystem::get_instance();
        if ($filesystem->execute->is_file($css_file)) {
            $filesystem->execute->delete($css_file);
        }
        if (!empty($css)) {
            $write = $filesystem->execute->put_contents($css_file, $css, FS_CHMOD_FILE);
            if($write){
                // Add information about writing.
                $results['css_file'] = self::get_stylesheet('byurl', $style_id);
                $results['write'] = $write;
                // Save Google Fonts
                if (!empty($fonts)) {
		    $fonts = implode('|',$fonts);
                    $builder_fonts = get_option('themify_builder_google_fonts');
                    if (!is_array($builder_fonts)) {
                        $builder_fonts = array();
                    }
                    if (isset($builder_fonts[$style_id])) {
                        $builder_fonts[$style_id] = $fonts;
                        $entry_fonts = $builder_fonts;
                    } else {
                        $entry_fonts = array($style_id => $fonts) + $builder_fonts;
                    }
                    update_option('themify_builder_google_fonts', $entry_fonts);
                }
             }
             else{
                 $results['write'] = esc_html__('Styles can`t be written.Please check permission of uploading folder', 'themify');
             }
        } else {
            // Add information about writing.
            $results['write'] = esc_html__('Nothing written. Empty CSS.', 'themify');
        }
        return $results;
    }

    /**
     * Return the URL or the directory path for a template, template part or content builder styling stylesheet.
     * 
     * @since 2.2.5
     *
     * @param string $mode Whether to return the directory or the URL. Can be 'bydir' or 'byurl' correspondingly. 
     * @param int $single ID of layout, layour part or entry that we're working with.
     *
     * @return string
     */
    private static function get_stylesheet($mode = 'bydir', $single = null) {
        static $before = null;
        if ($before === null) {
            $upload_dir = wp_upload_dir();
            $before = array(
                'bydir' => $upload_dir['basedir'],
                'byurl' => $upload_dir['baseurl'],
            );
        }
      
        if ($single===null) {
            $single = Themify_Builder_Model::get_ID();
        }
        $single = is_int($single) ? get_post($single) : get_page_by_path($single, OBJECT, 'tbuilder_layout_part');
        if (!is_object($single)) {
            return '';
        }
        $single = $single->ID;
        $path = "$before[$mode]/themify-css";
        if ('bydir' === $mode) {
            $filesystem = Themify_Filesystem::get_instance();
            if ( ! $filesystem->execute->is_dir($path) ) {
                wp_mkdir_p( $path);
            }
        }

        /**
         * Filters the return URL or directory path including the file name.
         *
         * @param string $stylesheet Path or URL for the global styling stylesheet.
         * @param string $mode What was being retrieved, 'bydir' or 'byurl'.
         * @param int $single ID of the template, template part or content builder that we're fetching.
         *
         */
        return apply_filters('themify_builder_get_stylesheet',  "$path/themify-builder-$single-generated.css", $mode, $single);
    }



    /**
     * Enqueues Google Fonts
     * 
     * @since 2.2.6
     */
    public static function enqueue_fonts($google_fonts) {
        $entry_google_fonts = get_option('themify_builder_google_fonts');
        if (!empty($entry_google_fonts) && is_array($entry_google_fonts)) {
            $entry_id = Themify_Builder_Model::get_ID();
            if (isset($entry_google_fonts[$entry_id])) {
                $fonts = explode('|', $entry_google_fonts[$entry_id]);
                $fonts = array_unique(array_filter($fonts));
                foreach ($fonts as $font) {
                    $google_fonts[] = $font;
                }
            }
        }
        return $google_fonts;
    }


    /**
     * Checks whether a file exists, can be loaded and is not empty.
     * 
     * @since 2.2.5
     * 
     * @param string $file_path Path in server to the file to check.
     * 
     * @return bool
     */
    private static function is_readable_and_not_empty($file_path = '') {
        return empty($file_path)?false:is_readable($file_path) && 0 !== filesize($file_path);
    }


    public static function slider_live_styling() {
        check_ajax_referer('tb_load_nonce', 'nonce');
        $bg_slider_data = $_POST['tb_background_slider_data'];
        $row_or_col = array(
            'styling' => array(
                'background_slider' => urldecode($bg_slider_data['shortcode']),
                'background_type' => 'slider',
                'background_slider_mode' => $bg_slider_data['mode'],
                'background_slider_speed' => $bg_slider_data['speed'],
                'background_slider_size' => $bg_slider_data['size'],
            )
        );
        Themify_Builder_Component_Base::do_slider_background($row_or_col, $bg_slider_data['type']);
        wp_die();
    }
        
    /**
     * Converts color in hexadecimal format to RGB format.
     *
     * @since 1.9.6
     *
     * @param string $hex Color in hexadecimal format.
     * @return string Color in RGB components separated by comma.
     */
    private static function hex2rgb($hex) {
        $hex = str_replace('#', '', $hex);

        if (strlen($hex) === 3) {
            $r = substr($hex, 0, 1);
            $g = substr($hex, 1, 1);
            $b = substr($hex, 2, 1);
            $r = hexdec($r . $r);
            $g = hexdec($g . $g);
            $b = hexdec($b. $b);
        } else {
            $r = hexdec(substr($hex, 0, 2));
            $g = hexdec(substr($hex, 2, 2));
            $b = hexdec(substr($hex, 4, 2));
        }
        return implode(',', array($r, $g, $b));
    }

    /**
     * Get RGBA color format from hex color
     *
     * @return string
     */
    public static function get_rgba_color($color) {
        if (strpos($color, 'rgba') !== false) {
            return $color;
        }
        $color = explode('_', $color);
        $opacity = isset($color[1]) && $color[1] !== '' ? $color[1] : '1';
        return $opacity >= 0 && $opacity !== '1' && $opacity !== '1.00' && $opacity !== '0.99' ? 'rgba(' . self::hex2rgb($color[0]) . ', ' . $opacity . ')' : ($color[0] !== '' ? ('#' . str_replace('#', '', $color[0])) : false);
    }
    
}
