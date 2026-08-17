<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Shortcode {
    private LC_Assets $assets;
    private int $instance = 0;

    public function __construct( LC_Assets $assets ) { $this->assets = $assets; }
    public function register(): void { add_shortcode( 'living_chronicle', array( $this, 'render' ) ); }

    public function render( array $attributes = array() ): string {
        $this->instance += 1;
        $attributes = shortcode_atts( array( 'profile' => 'default', 'slot' => '', 'height' => '720', 'music' => '' ), $attributes, 'living_chronicle' );
        $profile = sanitize_key( (string) $attributes['profile'] ) ?: 'default';
        $slot = sanitize_key( (string) $attributes['slot'] );
        if ( '' === $slot ) { $slot = 'instance-' . $this->instance; }
        $page_id = absint( get_queried_object_id() );
        if ( ! $page_id ) { $page_id = absint( get_the_ID() ); }
        $height = max( 360, min( 960, absint( $attributes['height'] ) ) );
        $id = wp_unique_id( 'living-chronicle-' );
        $config = array(
            'assetBase' => untrailingslashit( LC_URL . 'assets/build' ),
            'saveKey' => sprintf( 'eldric.living-chronicle.%d.%s.%s', $page_id, $profile, $slot ),
            'storyProvider' => 'wp-ai' === LC_Settings::active_provider() ? 'remote' : 'local',
            'storyEndpoint' => esc_url_raw( rest_url( 'lc/v1/story' ) ),
            'storyNonce' => wp_create_nonce( 'wp_rest' ),
            'musicUrl' => $this->music_url( (string) $attributes['music'] ),
        );
        $this->assets->enqueue();

        ob_start();
        include LC_PATH . 'templates/shortcode-container.php';
        return (string) ob_get_clean();
    }

    /**
     * Resolve the music="" attribute. Empty keeps the soundtrack bundled with
     * the plugin; "none" plays the authored chords instead; anything else must
     * be an http(s) URL — a media element would otherwise accept a javascript:
     * or data: URL straight from post content.
     */
    private function music_url( string $music ): string {
        $music = trim( $music );
        if ( '' === $music ) { return ''; }
        if ( 0 === strcasecmp( $music, 'none' ) ) { return 'none'; }
        $url = esc_url_raw( $music, array( 'http', 'https' ) );
        return $url ? $url : '';
    }
}
