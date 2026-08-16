<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Shortcode {
    private LC_Assets $assets;
    private int $instance = 0;

    public function __construct( LC_Assets $assets ) { $this->assets = $assets; }
    public function register(): void { add_shortcode( 'living_chronicle', array( $this, 'render' ) ); }

    public function render( array $attributes = array() ): string {
        $this->instance += 1;
        $attributes = shortcode_atts( array( 'profile' => 'default', 'height' => '720' ), $attributes, 'living_chronicle' );
        $profile = sanitize_key( (string) $attributes['profile'] ) ?: 'default';
        $height = max( 360, min( 960, absint( $attributes['height'] ) ) );
        $id = wp_unique_id( 'living-chronicle-' );
        $config = array(
            'assetBase' => untrailingslashit( LC_URL . 'assets/build' ),
            'saveKey' => sprintf( 'eldric.living-chronicle.%s.%d', $profile, $this->instance ),
            'storyProvider' => 'local',
            'storyEndpoint' => esc_url_raw( rest_url( 'lc/v1/story' ) ),
            'storyNonce' => wp_create_nonce( 'wp_rest' ),
        );
        $this->assets->enqueue();
        ob_start();
        include LC_PATH . 'templates/shortcode-container.php';
        return (string) ob_get_clean();
    }
}
