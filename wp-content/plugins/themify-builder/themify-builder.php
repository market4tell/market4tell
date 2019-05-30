<?php
/*
Plugin Name: Themify Builder
Plugin URI: https://themify.me/builder
Description: Build responsive layouts that work for desktop, tablets, and mobile using intuitive &quot;what you see is what you get&quot; drag &amp; drop framework with live edits and previews.
Version: 4.5.1 
Author: Themify
Author URI: https://themify.me
Text Domain:  themify
Domain Path:  /languages
*/


if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// Hook loaded
add_action( 'after_setup_theme', 'themify_builder_themify_dependencies',10 );
add_action( 'after_setup_theme', 'themify_builder_plugin_init', 15 );
add_filter( 'plugin_row_meta', 'themify_builder_plugin_meta', 10, 2 );
add_filter( 'plugin_action_links_' . plugin_basename(__FILE__), 'themify_builder_action_links' );
register_activation_hook(__FILE__, 'themify_builder_activate');
if(!function_exists('themify_builder_activate')){
	function themify_builder_activate(){
		set_transient('themify_builder_welcome_page', true, 30);
	}
}

if(!function_exists('themify_builder_fix_escaped_slashes')){
    function themify_builder_fix_escaped_slashes() {
            if( ! function_exists( 'themify_get_flag' ) || themify_get_flag( 'builder_escaped_slashes_fix' ) )
                    return;

            global $wpdb;
            $wpdb->query( "UPDATE {$wpdb->postmeta} SET meta_value = Replace( meta_value, '\\\/', '/' ) WHERE meta_key = '_themify_builder_settings_json'" );
            themify_set_flag( 'builder_escaped_slashes_fix' );
    }
    add_action( 'init', 'themify_builder_fix_escaped_slashes' );
}
if(!function_exists('themify_builder_plugin_meta')){
function themify_builder_plugin_meta( $links, $file ) {
	if ( plugin_basename( __FILE__ ) == $file ) {
		$row_meta = array(
		  'changelogs'    => '<a href="' . esc_url( 'https://themify.me/changelogs/' ) . basename( dirname( $file ) ) .'.txt" target="_blank" aria-label="' . esc_attr__( 'Plugin Changelogs', 'themify' ) . '">' . esc_html__( 'View Changelogs', 'themify' ) . '</a>'
		);
 
		return array_merge( $links, $row_meta );
	}
	return (array) $links;
}
}
if(!function_exists('themify_builder_action_links')){
function themify_builder_action_links( $links ) {
	if ( is_plugin_active( 'themify-updater/themify-updater.php' ) ) {
		$tlinks = array(
		 '<a href="' . admin_url( 'index.php?page=themify-license' ) . '">'.__('Themify License', 'themify') .'</a>',
		 );
	} else {
		$tlinks = array(
		 '<a href="' . esc_url('https://themify.me/docs/themify-updater-documentation') . '">'. __('Themify Updater', 'themify') .'</a>',
		 );
	}
	return array_merge( $links, $tlinks );
}
}

///////////////////////////////////////////
// Version Getter
///////////////////////////////////////////
if (!function_exists('themify_builder_get')) {

    function themify_builder_get($theme_var, $builder_var = false) {
        if (Themify_Builder_Model::is_themify_theme()) {
            return themify_get($theme_var);
        }
        if ($builder_var === false) {
            return false;
        }
        global $post;
        $data = Themify_Builder_Model::get_builder_settings();
        if (isset($data[$builder_var]) && $data[$builder_var] !== '') {
            return $data[$builder_var];
        } else if (is_object($post) && ($val = get_post_meta($post->ID, $builder_var, true)) !== '') {
            return $val;
        }
        return null;
    }

}
if(!function_exists('themify_builder_themify_dependencies')){
	/**
	 * Load themify functions
	 */
	function themify_builder_themify_dependencies(){
		if ( class_exists( 'Themify_Builder' ) ) return;

		if ( ! defined( 'THEMIFY_DIR' ) ) {
                        $path = plugin_dir_path( __FILE__ ) ;
			define( 'THEMIFY_VERSION', themify_builder_get_plugin_version() );
			define( 'THEMIFY_DIR', $path. 'themify' );
			define( 'THEMIFY_URI', plugin_dir_url( __FILE__ ) . 'themify' );
			require_once( THEMIFY_DIR . '/themify-database.php' );
			require_once( THEMIFY_DIR . '/img.php' );
			require_once( THEMIFY_DIR . '/themify-utils.php' );
			require_once( THEMIFY_DIR . '/themify-hooks.php' );
			require_once( $path. 'theme-options.php' );
			if( is_admin() ) {
				require_once( THEMIFY_DIR . '/themify-wpajax.php' );
			}
                        if( ! class_exists( 'Themify_Metabox' ) ) {
                            require_once( plugin_dir_path( __FILE__ ) . 'themify/themify-metabox/themify-metabox.php' );
                        }
		}
		require_once( THEMIFY_DIR . '/google-fonts/functions.php' );
		if( ! function_exists( 'themify_get_featured_image_link' ) ) {
			require_once( THEMIFY_DIR . '/themify-template-tags.php' );
		}

		if( ! class_exists( 'Themify_Icon_Picker' ) ) {
			require_once( THEMIFY_DIR . '/themify-icon-picker/themify-icon-picker.php' );
			Themify_Icon_Picker::get_instance( trailingslashit( THEMIFY_URI ) . 'themify-icon-picker' );
		}
		Themify_Icon_Picker::get_instance()->register( 'Themify_Icon_Picker_FontAwesome' );
		Themify_Icon_Picker::get_instance()->register( 'Themify_Icon_Picker_Themify' );
	}
}

// register additional field types used by Builder
add_action( 'themify_metabox/field/page_builder', 'themify_meta_field_page_builder', 10, 1 );
add_action( 'themify_metabox/field/fontawesome', 'themify_meta_field_fontawesome', 10, 1 );
add_action( 'themify_metabox/field/query_category', 'themify_meta_field_query_category', 10, 1 );
add_action( 'themify_metabox/field/featimgdropdown', 'themify_meta_field_featimgdropdown', 10, 1 );

if ( ! function_exists( 'themify_builder_plugin_init' ) ) :
	/**
	 * Init Plugin
	 * called after theme to avoid redeclare function error
	 */
function themify_builder_plugin_init() {
	if ( class_exists('Themify_Builder') ) return;

	global $ThemifyBuilder, $Themify_Builder_Options, $Themify_Builder_Layouts;

	/**
	 * Define builder constant
	 */
	define( 'THEMIFY_BUILDER_VERSION', THEMIFY_VERSION );
	define( 'THEMIFY_BUILDER_VERSION_KEY', 'themify_builder_version' );
	define( 'THEMIFY_BUILDER_NAME', trim( dirname( plugin_basename( __FILE__) ), '/' ) );
	define( 'THEMIFY_BUILDER_SLUG', trim( plugin_basename( __FILE__), '/' ) );

	/**
	 * Layouts Constant
	 */
	define( 'THEMIFY_BUILDER_LAYOUTS_VERSION', '1.1.1' );

	// File Path
	define( 'THEMIFY_BUILDER_DIR', dirname(__FILE__) );
	define( 'THEMIFY_BUILDER_MODULES_DIR', THEMIFY_BUILDER_DIR . '/modules' );
	define( 'THEMIFY_BUILDER_TEMPLATES_DIR', THEMIFY_BUILDER_DIR . '/templates' );
	define( 'THEMIFY_BUILDER_CLASSES_DIR', THEMIFY_BUILDER_DIR . '/classes' );
	define( 'THEMIFY_BUILDER_INCLUDES_DIR', THEMIFY_BUILDER_DIR . '/includes' );
	define( 'THEMIFY_BUILDER_LIBRARIES_DIR', THEMIFY_BUILDER_INCLUDES_DIR . '/libraries' );

	// URI Constant
	define( 'THEMIFY_BUILDER_URI', plugins_url( '' , __FILE__ ) );

	// Include files
	require_once( THEMIFY_BUILDER_CLASSES_DIR . '/class-themify-builder-model.php' );
	require_once( THEMIFY_BUILDER_CLASSES_DIR . '/class-themify-builder-layouts.php' );
	require_once( THEMIFY_BUILDER_CLASSES_DIR . '/class-themify-builder.php' );
	require_once( THEMIFY_BUILDER_CLASSES_DIR . '/class-themify-builder-options.php' );
	require_once( THEMIFY_DIR . '/class-themify-access-role.php' );
	require_once( THEMIFY_DIR . '/class-themify-filesystem.php' );

	// Load Localization
	load_plugin_textdomain( 'themify', false, '/languages' );

	if ( Themify_Builder_Model::builder_check() ) {

		do_action( 'themify_builder_before_init' );

		// instantiate the plugin class
		$Themify_Builder_Layouts = new Themify_Builder_Layouts();
		$ThemifyBuilder = new Themify_Builder();
		$ThemifyBuilder->init();

		// initiate metabox panel
		themify_build_write_panels(array());
		require_once( THEMIFY_DIR . '/class-themify-cache.php' );
	}

	// register builder options page
	if ( class_exists( 'Themify_Builder_Options' ) ) {
		$ThemifyBuilderOptions = new Themify_Builder_Options();
	}

	if( is_admin() ) {
		add_action( 'admin_enqueue_scripts', 'themify_enqueue_scripts' );
	}

	/**
	 * Load class for mobile detection if it doesn't exist yet
	 * @since 1.6.8
	 */
	if ( ! class_exists( 'Themify_Mobile_Detect' ) ) {
		require_once THEMIFY_DIR . '/class-themify-mobile-detect.php';
		global $themify_mobile_detect;
		$themify_mobile_detect = new Themify_Mobile_Detect;
	}

	add_action( 'wp_head', 'themify_above_the_fold_css', 7 );
}
endif;

if ( ! function_exists( 'themify_builder_get_plugin_version' ) ) {
	/**
	 * Return plugin version.
	 *
	 * @since 1.4.2
	 *
	 * @return string
	 */
	function themify_builder_get_plugin_version() {
		static $version=null;
		if ($version===null) {
			$data = get_file_data( __FILE__, array( 'Version' ) );
			$version = $data[0];
		}
		return $version;
	}
}

if ( ! function_exists('themify_builder_edit_module_panel') ) {
	/**
	 * Hook edit module frontend panel
	 * @param $mod_name
	 * @param $mod_settings
	 */
	function themify_builder_edit_module_panel( $mod_name, $mod_settings ) {
		do_action( 'themify_builder_edit_module_panel', $mod_name, $mod_settings );
	}
}
