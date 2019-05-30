<template id="tmpl-builder_lightbox">
    <?php //create fix overlay on top iframe,mouse position will be always on top iframe on resizing  ?>
    <div class="tb_resizable_overlay"></div>
    <div id="tb_lightbox_parent" class="themify_builder builder-lightbox <?php echo Themify_Builder_Model::is_themify_theme()?'is-themify-theme':'is-not-themify-theme'?>">
        <div class="tb_lightbox_top_bar clearfix">
            <ul class="tb_options_tab clearfix"></ul>
            <div class="tb_lightbox_actions">
                <a class="builder_cancel_docked_mode"><i class="ti-new-window"></i></a>
                <div class="tb_close_lightbox"><span><?php _e('Cancel', 'themify') ?></span><i class="ti-close"></i></div>
                <span class="tb_lightbox_actions_wrap"></span>	
            </div>
        </div>
        <div id="tb_lightbox_container"></div>
	    <div class="tb_resizable tb_resizable-st" data-axis="-y"></div>
        <div class="tb_resizable tb_resizable-e" data-axis="x"></div>
        <div class="tb_resizable tb_resizable-s" data-axis="y"></div>
        <div class="tb_resizable tb_resizable-w" data-axis="w"></div>
        <div class="tb_resizable tb_resizable-se" data-axis="se"></div>
	    <div class="tb_resizable tb_resizable-we" data-axis="sw"></div>
        <div class="tb_resizable tb_resizable_nw" data-axis="nw"></div>
        <div class="tb_resizable tb_resizable_ne" data-axis="ne"></div>
    </div>
</template>
<script type="text/template" id="tmpl-builder_lite_lightbox_confirm">
    <p>{{ data.message }}</p>
    <p>
    <# _.each(data.buttons, function(value, key) { #> 
    <button data-type="{{ key }}">{{ value.label }}</button> 
    <# }); #>
    </p>
</script>
<script type="text/template" id="tmpl-builder_lite_lightbox_prompt">
    <p>{{ data.message }}</p>
    <p><input type="text" class="tb_litelightbox_prompt_input"></p>
    <p>
    <# _.each(data.buttons, function(value, key) { #> 
    <button data-type="{{ key }}">{{ value.label }}</button> 
    <# }); #>
    </p>
</script>
<template id="tmpl-builder_row_item">
    <?php if(is_admin()):?>
	<div class="page-break-overlay"></div>
    <?php endif;?>
    <span class="tb_row_anchor"></span>
    <div class="tb_action_wrap tb_row_action"></div>
    <div class="row_inner"></div>
</template>
<template id="tmpl-builder_subrow_item">
    <div class="tb_action_wrap tb_subrow_action"></div>
    <div class="subrow_inner"></div>
</template>
<template id="tmpl-builder_column_item">
    <div class="tb_action_wrap tb_column_action"></div>
    <div class="tb_grid_drag tb_drag_right tb_disable_sorting"></div>
    <div class="tb_grid_drag tb_drag_left tb_disable_sorting"></div>
    <div class="tb_holder"></div>
    <div class="tb_column_btn_plus tb_disable_sorting"></div>
</template>
<template id="tmpl-builder_row_action">
    <ul class="tb_dropdown">
	<li class="ti-move"></li>
	<li class="tb_row_settings ti-settings" data-href="tb_row_options">
	    <div class="themify_tooltip"><?php _e('Options', 'themify') ?></div>
	</li>
	<li class="tb_styling ti-brush">
	    <div class="themify_tooltip"><?php _e('Styling', 'themify') ?></div>
	</li>
	<li class="tb_duplicate ti-layers">
	    <div class="themify_tooltip"><?php _e('Duplicate', 'themify') ?></div>
	</li>
	<li class="tb_save_component ti-save">
	    <div class="themify_tooltip"><?php _e('Save', 'themify') ?></div>
	</li>
	<li class="tb_delete_row_container tb_delete ti-close">
	    <div class="themify_tooltip"><?php _e('Delete', 'themify') ?></div>
	</li>
	<li class="tb_action_more ti-more">
	    <div class="themify_tooltip"><?php _e('More', 'themify') ?></div>
	    <ul>
		<li class="ti-export"><?php _e(' Export', 'themify') ?></li>
		<li class="ti-import"><?php _e(' Import', 'themify') ?></li>
		<li class="tb_copy_component ti-files"><?php _e(' Copy', 'themify') ?></li>
		<li class="tb_inner_action_more ti-clipboard">
		    <?php _e('Paste', 'themify') ?>
		    <ul>
			<li class="tb_paste_component"><?php _e('Content & Styling', 'themify') ?></li>
			<li class="tb_paste_style"><?php _e('Styling Only', 'themify') ?></li>
		    </ul>
		</li>
		<li class="tb_visibility_component ti-eye">
		    <?php _e('Visibility', 'themify') ?>
		</li>
	    </ul>
	</li>
    </ul> 
    <div id="tb_row_options" class="tb_toolbar_tabs">
	<a href="#" class="tb_row_hover_expand ti-new-window tb_edit"></a>
	<ul class="tb_row_toolbar_menu">
	    <li class="selected" data-href="tb_rgrids"><?php _e('Grid', 'themify') ?></li>
	    <li data-href="tb_roptions"><?php _e('Row Options', 'themify') ?></li>
	</ul>
	<div id="tb_rgrids" class="selected">
	    <?php Themify_Builder_Model::grid(); ?>
	</div>
	<div id="tb_roptions"></div>
    </div>
</template>
<template id="tmpl-builder_column_action">
    <ul class="tb_dropdown">
	<li class="tb_styling ti-brush">
	    <div class="themify_tooltip"><?php _e('Styling', 'themify') ?></div>
	</li>
	<li class="ti-import">
	    <div class="themify_tooltip"><?php _e('Import', 'themify') ?></div>
	</li>
	<li class="ti-export">
	    <div class="themify_tooltip"><?php _e('Export', 'themify') ?></div>
	</li>
	<li class="ti-files tb_copy_component">
	    <div class="themify_tooltip"><?php _e('Copy', 'themify') ?></div>
	</li>
	<li class="ti-clipboard tb_inner_action_more">
	    <div class="themify_tooltip"><?php _e('Paste', 'themify') ?></div>
	    <ul>
		<li class="tb_paste_component"><?php _e('Content & Styling', 'themify') ?></li>
		<li class="tb_paste_style"><?php _e('Styling Only', 'themify') ?></li>
	    </ul>
	</li>
    </ul>
</template>
<template id="tmpl-builder_subrow_action">
    <ul class="tb_dropdown">
	<li class="ti-move"></li>
	<li class="tb_row_settings ti-settings" data-href="tb_rgrids">
	    <div class="themify_tooltip"><?php _e('Options', 'themify') ?></div>
	</li>
	<li class="tb_styling ti-brush">
	    <div class="themify_tooltip"><?php _e('Styling', 'themify') ?></div>
	</li>
	<li class="tb_duplicate ti-layers">
	    <div class="themify_tooltip"><?php _e('Duplicate', 'themify') ?></div>
	</li>
	<li class="tb_delete ti-close">
	    <div class="themify_tooltip"><?php _e('Delete', 'themify') ?></div>
	</li>
	<li class="tb_action_more ti-more">
	    <div class="themify_tooltip"><?php _e('More', 'themify') ?></div>
	    <ul>
		<li class="ti-export">
		    <?php _e('Export', 'themify') ?>
		</li>
		<li class="ti-import">
		    <?php _e('Import', 'themify') ?>
		</li>
		<li class="tb_copy_component ti-files">
		    <?php _e('Copy', 'themify') ?>
		</li>
		<li class="tb_inner_action_more ti-clipboard">
		    <?php _e('Paste', 'themify') ?>
		    <ul>
			<li class="tb_paste_component"><?php _e('Content & Styling', 'themify') ?></li>
			<li class="tb_paste_style"><?php _e('Styling Only', 'themify') ?></li>
		    </ul>
		</li>
		<li class="tb_visibility_component ti-eye">
		    <?php _e('Visibility', 'themify') ?>
		</li>
	    </ul>
	</li>
    </ul>
    <div id="tb_rgrids" class="tb_toolbar_tabs">
	<a href="#" class="tb_row_hover_expand ti-new-window tb_edit"></a>
	<?php Themify_Builder_Model::grid(); ?>
    </div>
</template>
<template id="tmpl-builder_module_action">
    <ul class="tb_dropdown">
	<li class="tb_edit ti-pencil">
	    <div class="themify_tooltip"><?php _e('Edit', 'themify') ?></div>
	</li>
	<li class="tb_styling ti-brush">
	    <div class="themify_tooltip"><?php _e('Styling', 'themify') ?></div>
	</li>
	<li class="tb_duplicate ti-layers">
	    <div class="themify_tooltip"><?php _e('Duplicate', 'themify') ?></div>
	</li>
	<li class="tb_save_component ti-save">
	    <div class="themify_tooltip"><?php _e('Save', 'themify') ?></div>
	</li>
	<li class="tb_swap ti-reload">
	    <div class="themify_tooltip"><?php _e('Swap', 'themify') ?></div>
	</li>
	<li class="tb_delete ti-close">
	    <div class="themify_tooltip"><?php _e('Delete', 'themify') ?></div>
	</li>
	<li class="tb_action_more ti-more">
	    <div class="themify_tooltip"><?php _e('More', 'themify') ?></div>
	    <ul>
		<li class="ti-export">
		    <?php _e('Export', 'themify') ?>
		</li>
		<li class="ti-import">
		    <?php _e('Import', 'themify') ?>
		</li>
		<li class="tb_copy_component ti-files">
		    <?php _e('Copy', 'themify') ?>
		</li>
		<li class="tb_inner_action_more ti-clipboard">
		    <?php _e('Paste', 'themify') ?>
		    <ul>
			<li class="tb_paste_component"><?php _e('Content & Styling', 'themify') ?></li>
			<li class="tb_paste_style"><?php _e('Styling Only', 'themify') ?></li>
		    </ul>
		</li>
		<li class="tb_visibility_component ti-eye">
		    <?php _e('Visibility', 'themify') ?>
		</li>
	    </ul>
	</li>
    </ul>
</template>
<template id="tmpl-last_row_add_btn">
    <div class="tb_last_add_btn_expand">
        <div class="tb_row_grid" data-col="1"><span class="tb_col_1"></span></div>
        <div class="tb_row_grid" data-col="2"><span class="tb_col_2"></span></div>
        <div class="tb_row_grid" data-col="3"><span class="tb_col_3"></span></div>
        <div class="tb_row_grid" data-col="4"><span class="tb_col_4"></span></div>
        <div class="tb_row_grid" data-col="5"><span class="tb_col_5"></span></div>
        <div class="tb_row_grid" data-col="6"><span class="tb_col_6"></span></div>
        <div class="tb_add_blocks">
           <span class="tb_block_plus_text"><?php _e('Blocks','themify'); ?></span>
        </div>
    </div>
</template>
