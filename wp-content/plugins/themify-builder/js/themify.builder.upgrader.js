/* globals ajaxurl, themify_lang */
;
(function ($, window, document, undefined) {

    'use strict';

    var _updater_el;

    function showLogin(status) {
        $('.prompt-box .show-login').show();
        $('.prompt-box .show-error').hide();
		$('.prompt-box .prompt-error').remove();
        if (status === 'error') {
			$('.prompt-box .prompt-msg').after('<p class="prompt-error">' + themify_lang.invalid_login + '</p>');
		} else if ('unsuscribed' === status) {
			$('.prompt-box .prompt-msg').after('<p class="prompt-error">' + themify_lang.unsuscribed + '</p>');
		}
        $('.prompt-box').addClass('update-plugin');
        $('.overlay, .prompt-box').fadeIn(500);
    }
    function hideLogin() {
        $('.overlay, .prompt-box').fadeOut(500);
    }
    function showAlert() {
        $('.alert').addClass('busy').fadeIn(800);
    }
    function hideAlert(status) {
        if (status === 'error') {
            status = 'error';
            showErrors();
        } else {
            status = 'done';
        }
        $('.alert').removeClass('busy').addClass(status).delay(800).fadeOut(800, function () {
            $(this).removeClass(status);
        });
    }
    function showErrors(verbose) {
        $('.overlay, .prompt-box').delay(900).fadeIn(500);
        $('.prompt-box .show-error').show();
        $('.prompt-box .show-error p').remove();
        $('.prompt-box .error-msg').after('<p class="prompt-error">' + verbose + '</p>');
        $('.prompt-box .show-login').hide();
    }

    // Regenerate CSS Files
    function themify_regenerate_css_files(){
		var $button = $('#builder-regenerate-css-files');
		$button.click(function(){
			var filesJson = $button.attr('data-files');
			if('' == filesJson){
				alert('No CSS files to regenerate!');
				return;
			}
			$button.attr('value','Regenerating ...');
			$button.attr('disabled','disabled');
			filesJson = JSON.parse(filesJson);
			var i = 1;
			for (var group in filesJson) {
				$.ajax({
					url: tb_updater_js_vars.ajax_url,
					type: 'post',
					data: {
						action: 'themify_regenerate_css_files_ajax',
						files : JSON.stringify(filesJson[group]),
						group_number : i,
						total_groups : Object.keys(filesJson).length,
						nonce: tb_updater_js_vars.nonce
					},
					success: function(data){
						if('finished' == data){
							$button.removeAttr('disabled');
							$button.attr('value','Regenerate CSS Files');
						}
					}
				});
				i++;
			}
			

		})
    }
    
    // Get builder posts and make data ready to send find and replace ajax request
	function tb_get_builder_posts(){
		$.ajax({
			url: ajaxurl,
			type: 'post',
			data: {
				action: 'themify_get_builder_posts',
				from_ajax: true,
				nonce: themify_js_vars.nonce
			},
			success: function(result){
				result = JSON.parse(result);
				if('' == result['posts']){
					alert('No builder data found!');
					var $button = $('#builder-find-and-replace-btn-plugin');
					$button.removeAttr('disabled');
					$button.attr('value','Replace');
					return;
				}
				var originalString = $('#original_string').val(),
					replaceString = $('#replace_string').val();
				for (var i = 1; i <= result['groups']; i++) {
					var data = {
						'group': i
						,'total': result['groups']
						,'originalString': originalString
						,'replaceString': replaceString
					};
					tb_send_find_replace_ajax_request(data);
				}
			}
		});
	}
	
	// Handle find and replace string functionality tools
	function tb_find_and_replace(){
		var $button = $('#builder-find-and-replace-btn-plugin');
		$button.click(function(){
			if('' === $('#original_string').val()){
				alert('Please fill original value for search!');
				return;
			}
			if (!confirm("WARNING: This will replace all data in your database. It can not be undone. Please backup your database before proceeding.")) {
				return;
			}
			$button.attr('value','Replacing ...');
			$button.attr('disabled','disabled');
			tb_get_builder_posts();
		});
	}

	// Send find and replace ajax request
	function tb_send_find_replace_ajax_request(vars){
		$.ajax({
			url: ajaxurl,
			type: 'post',
			data: {
				action: 'themify_find_and_replace_ajax',
				group_number : vars.group,
				total_groups : vars.total,
				original_string : vars.originalString,
				replace_string : vars.replaceString,
				nonce: themify_js_vars.nonce
			},
			success: function(result){
				if( -1 !== result.indexOf('finished-')){
					var $button = $('#builder-find-and-replace-btn-plugin');
					$button.removeAttr('disabled');
					$button.attr('value','Replace');
					var count = result.replace("finished-", "");
					alert('Replace operation was completed successfully. ' + count + ' strings found and replaced.');
				}
			}
		});
	}

    $(function () {
        //
        // Upgrade Theme / Framework
        //
        $('.tb_upgrade_plugin').on('click', function (e) {
            e.preventDefault();
            $('.themify-builder-upgrade-plugin').removeClass('themify-builder-upgrade-plugin');
            _updater_el = $(this).addClass('themify-builder-upgrade-plugin');
            showLogin();
        });

		// Update By Link
		( function() {
			var url = window.location.search;

			if( url.indexOf( 'tfplugin' ) > -1 ) {
				var plugin = url.match( /tfplugin=([^&,#]+)/ );

				if( plugin[1] ) {
					plugin = plugin[1];
					$( '.tb_upgrade_plugin[data-plugin*=' + plugin + ']' ).trigger( 'click' );
				}
			}
		} )();

        //
        // Login Validation
        //
        $('.tb_upgrade_login').on('click', function (e) {
            e.preventDefault();
            if ($('.prompt-box').hasClass('update-plugin')) {
                var el = $(this),
                        username = el.parent().parent().find('.username').val(),
                        password = el.parent().parent().find('.password').val(),
                        login = el.closest('.notifications').find('.update').hasClass('login');
                if (username !== '' && password !== '') {
                    hideLogin();
                    showAlert();
                    $.post(
                            ajaxurl,
                            {
                                'action': 'themify_builder_validate_login',
                                'type': 'plugin',
                                'login': login,
                                'username': username,
                                'password': password,
                                'nicename_short': _updater_el.data('nicename_short'),
                                'update_type': _updater_el.data('update_type')
                            },
                    function (data) {
                        data = $.trim(data);
                        if (data === 'true') {
                            hideAlert();
                            $('#themify_update_form').append('<input type="hidden" name="plugin" value="' + _updater_el.data('plugin') + '" /><input type="hidden" name="package_url" value="' + _updater_el.data('package_url') + '" />').submit();
                        } else if (data === 'unsuscribed') {
                            hideAlert('error');
                            showLogin('unsuscribed');
                        } else {
							hideAlert('error');
                            showLogin('error');
						}
                    }
                    );
                } else {
                    hideAlert('error');
                    showLogin('error');
                }
            }
        });
        //
        // Hide Overlay
        //
        $('.overlay').on('click', function () {
            hideLogin();
        });
        $( document ).ready( function() {		
            themify_regenerate_css_files();
            tb_find_and_replace();
        } );
    });

    
}(jQuery, window, document));