<?php if (!defined('ABSPATH')) exit; // Exit if accessed directly    ?>
<div class="themify_builder_content themify_builder_content-<?php echo $args['builder_id']; ?> themify_builder<?php if ($ThemifyBuilder->in_the_loop): ?> in_the_loop not_editable_builder<?php endif; ?>" data-postid="<?php echo $args['builder_id']; ?>">

    <?php
    foreach ($args['builder_output'] as $key => $row) {
        if (!empty($row)) {
            if (!isset($row['row_order'])) {
                $row['row_order'] = $key; // Fix issue with import content has same row_order number
            }
            Themify_Builder_Component_Row::template($key, $row, $args['builder_id'], true, false);
        }
    } // end row loop
    ?>
</div>