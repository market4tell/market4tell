<?php
if (!defined('ABSPATH'))
    exit; // Exit if accessed directly
global $bids;
if(Themify_Builder::$frontedit_active || !isset($bids[$args['builder_id']])){
    global  $post;
    if ( is_object( $post ) ) {
            $saved_post = clone $post;
    }
    $bids[$args['builder_id']] = 1;
    $post = get_post( $args['builder_id'] );
    $styles = Themify_Builder_Stylesheet::enqueue_stylesheet( true, $post->ID );
    if ( $styles ) {
        $fonts = Themify_Builder_Stylesheet::enqueue_fonts( array() );
        ?>
        <link class="themify-builder-generated-css" type="text/css" rel="stylesheet" href="<?php echo $styles['url']?>" />
        <?php if ( ! empty( $fonts ) ) : ?>
                <link class="themify-builder-generated-css" type="text/css" rel="stylesheet" href="//fonts.googleapis.com/css?family=<?php echo implode( '|', $fonts ); ?>" />
        <?php endif;
    }
    if ( isset( $saved_post )  ) {
        $post = $saved_post;
    }
}
Themify_Builder::$frontedit_active = false;
?>
<div class="themify_builder_content themify_builder_content-<?php echo $args['builder_id']; ?> themify_builder not_editable_builder" data-postid="<?php echo $args['builder_id']; ?>">
    <?php
    foreach ($args['builder_output'] as $rows => $row) :
        if (!empty($row)) {
            if (!isset($row['row_order'])) {
                $row['row_order'] = $rows; // Fix issue with import content has same row_order number
            }
            echo Themify_Builder_Component_Row::template($rows, $row, $args['builder_id'], false, false);
        }
    endforeach; // end row loop
    ?>
</div>