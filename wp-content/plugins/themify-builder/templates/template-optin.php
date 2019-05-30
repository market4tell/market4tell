<?php
if ( ! defined( 'ABSPATH' ) )
	exit; // Exit if accessed directly
/**
 * Template Newsletter
 * 
 * Access original fields: $mod_settings
 * @author Themify
 */

if ( TFCache::start_cache( $args['mod_name'], self::$post_id, array( 'ID' => $args['module_ID'] ) ) ):

$fields_default = array(
	'mod_title' => '',
	'provider' => 'mailchimp',
	'layout' => 'inline_block',
	'label_firstname' => '',
	'fname_hide' => 0,
	'default_fname' => __( 'John', 'themify' ),
	'lname_hide' => 0,
	'label_lastname' => '',
	'default_lname' => __( 'Doe', 'themify' ),
	'label_email' => '',
	'label_submit' => '',
	'success_action' => 's2',
	'redirect_to' => '',
	'message' => '',
	'css' => '',
	'animation_effect' => '',
);
$fields_args = wp_parse_args( $args['mod_settings'], $fields_default );
unset( $mod_settings );
$instance = Builder_Optin_Services_Container::get_instance()->get_provider( $fields_args['provider'] );
if ( ! $instance )
	return;
$animation_effect = self::parse_animation_effect( $fields_args['animation_effect'], $fields_args );

$container_class = apply_filters( 'themify_builder_module_classes', array(
	'module', 'module-' . $args['mod_name'], $args['module_ID'], $fields_args['css'], $animation_effect, $fields_args['layout']
	), $args['mod_name'], $args['module_ID'], $fields_args
);
if ( ! empty( $args['element_id'] ) ) {
    $container_class[] = 'tb_' . $args['element_id'];
}
$container_props = apply_filters( 'themify_builder_module_container_props', array(
	'id' => $args['module_ID'],
	'class' => implode(' ', $container_class ),
), $fields_args, $args['mod_name'], $args['module_ID'] );
?>
<!-- module optin -->
<div <?php echo self::get_element_attributes( $container_props ); ?>>
	<?php if ( $fields_args['mod_title'] !== '' ) : ?>
		<?php echo $fields_args['before_title'] . apply_filters( 'themify_builder_module_title', $fields_args['mod_title'], $fields_args ) . $fields_args['after_title']; ?>
	<?php endif; ?>

	<?php
	if ( is_wp_error( ( $error = $instance->check_user_data( $fields_args ) ) ) ) :
		if ( current_user_can( 'manage_options' ) ) {
			echo $error->get_error_message();
		}
	?>
	<?php else: ?>
	<form class="tb_optin_form" name="tb_optin" method="post"
		action="<?php echo esc_attr( admin_url( 'admin-ajax.php' ) ); ?>"
		data-success="<?php echo esc_attr( $fields_args['success_action'] ); ?>"
	>
		<input type="hidden" name="action" value="tb_optin_subscribe" />
		<input type="hidden" name="tb_optin_redirect" value="<?php echo esc_attr( $fields_args['redirect_to'] ); ?>" />
		<input type="hidden" name="tb_optin_provider" value="<?php echo esc_attr( $fields_args['provider'] ); ?>" />

		<?php
		foreach ( $instance->get_options() as $provider_field ) :
			if ( isset( $provider_field['id'] ) && isset( $fields_args[ $provider_field['id'] ] ) ) : ?>
				<input type="hidden" name="tb_optin_<?php echo $provider_field['id']; ?>" value="<?php echo esc_attr( $fields_args[ $provider_field['id'] ] ); ?>" />
			<?php endif;
		endforeach;
		?>

		<?php if ( $fields_args['fname_hide'] ) : ?>
			<input type="hidden" name="tb_optin_fname" value="<?php echo esc_attr( $fields_args['default_fname'] ); ?>" />
		<?php else : ?>
			<div class="tb_optin_fname">
				<label class="tb_optin_fname_text"><?php echo esc_html( $fields_args['label_firstname'] ) ?></label>
				<input type="text" name="tb_optin_fname" required="required" class="tb_optin_input" />
			</div>
		<?php endif; ?>

		<?php if ( $fields_args['lname_hide'] ) : ?>
			<input type="hidden" name="tb_optin_lname" value="<?php echo esc_attr( $fields_args['default_lname'] ); ?>" />
		<?php else : ?>
			<div class="tb_optin_lname">
				<label class="tb_optin_lname_text"><?php echo esc_html( $fields_args['label_lastname'] ) ?></label>
				<input type="text" name="tb_optin_lname" required="required" class="tb_optin_input"/>
			</div>
		<?php endif; ?>

		<div class="tb_optin_email">
			<label class="tb_optin_email_text"><?php echo esc_html( $fields_args['label_email'] ) ?></label>
			<input type="email" name="tb_optin_email" required="required" class="tb_optin_input" />
		</div>
		<div class="tb_optin_submit">
			<button><?php echo esc_html( $fields_args['label_submit'] ) ?></button>
		</div>
	</form>

	<div class="tb_optin_success_message tb_text_wrap" style="display: none;">
		<?php echo $fields_args['message']!==''?apply_filters( 'themify_builder_module_content', $fields_args['message'] ):''; ?>
	</div>
	<?php endif; ?>
</div><!-- /module optin -->

<?php endif; TFCache::end_cache(); ?>