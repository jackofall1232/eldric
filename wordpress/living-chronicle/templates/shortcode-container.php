<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
<div
    id="<?php echo esc_attr( $id ); ?>"
    class="living-chronicle"
    data-eldric-game
    data-eldric-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>"
    style="min-height:<?php echo esc_attr( (string) $height ); ?>px"
>
    <noscript><?php esc_html_e( 'Eldric: The Living Chronicle requires JavaScript.', 'living-chronicle' ); ?></noscript>
</div>
