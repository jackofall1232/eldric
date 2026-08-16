<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Settings {
    public const OPTION = 'lc_story_settings';
    public const PROVIDERS = array( 'local', 'wp-ai' );
    private const DEFAULTS = array( 'provider' => 'local', 'ai_provider' => '', 'api_key' => '' );

    public function register_setting(): void {
        register_setting( 'lc_story', self::OPTION, array( 'type' => 'array', 'sanitize_callback' => array( $this, 'sanitize' ), 'default' => self::DEFAULTS ) );
    }
    public function sanitize( mixed $submitted ): array {
        $existing = get_option( self::OPTION, self::DEFAULTS );
        $submitted = is_array( $submitted ) ? $submitted : array();
        $provider = sanitize_key( (string) ( $submitted['provider'] ?? $existing['provider'] ?? 'local' ) );
        if ( ! in_array( $provider, self::PROVIDERS, true ) ) { $provider = 'local'; }
        $ai_provider = sanitize_key( (string) ( $submitted['ai_provider'] ?? $existing['ai_provider'] ?? '' ) );
        if ( ! in_array( $ai_provider, LC_Provider_WP_AI::KNOWN_PROVIDERS, true ) ) { $ai_provider = ''; }
        $key = (string) ( $existing['api_key'] ?? '' );
        if ( ! empty( $submitted['clear_key'] ) ) { $key = ''; }
        elseif ( isset( $submitted['api_key'] ) && '' !== trim( (string) $submitted['api_key'] ) ) { $key = substr( sanitize_text_field( wp_unslash( $submitted['api_key'] ) ), 0, 512 ); }
        // Re-probe on the next screen so a connector keyed moments ago shows up.
        LC_Provider_WP_AI::flush_probe_cache();
        return array( 'provider' => $provider, 'ai_provider' => $ai_provider, 'api_key' => $key );
    }

    /** The provider the administrator chose, regardless of availability. */
    public static function chosen_provider(): string {
        $settings = get_option( self::OPTION, self::DEFAULTS );
        $provider = is_array( $settings ) ? (string) ( $settings['provider'] ?? 'local' ) : 'local';
        return in_array( $provider, self::PROVIDERS, true ) ? $provider : 'local';
    }

    /** The provider that will actually serve requests right now. */
    public static function active_provider(): string {
        $provider = self::chosen_provider();
        if ( 'wp-ai' === $provider && ! LC_Provider_WP_AI::configured() ) { return 'local'; }
        return $provider;
    }

    /** The AI connector the administrator chose; empty means "let the site decide". */
    public static function chosen_ai_provider(): string {
        $settings = get_option( self::OPTION, self::DEFAULTS );
        $provider = is_array( $settings ) ? sanitize_key( (string) ( $settings['ai_provider'] ?? '' ) ) : '';
        return in_array( $provider, LC_Provider_WP_AI::KNOWN_PROVIDERS, true ) ? $provider : '';
    }

    /**
     * The AI connector that will actually be asked. A chosen connector that is
     * no longer configured falls back to the site default rather than failing,
     * so a revoked key costs narration quality, never play.
     */
    public static function active_ai_provider(): string {
        $provider = self::chosen_ai_provider();
        if ( '' === $provider ) { return ''; }
        $configured = LC_Provider_WP_AI::configured_providers();
        // A front-end request never probes, so an empty list there is unknown, not absent.
        if ( empty( $configured ) && ! LC_Provider_WP_AI::probe_is_live() ) { return $provider; }
        return in_array( $provider, $configured, true ) ? $provider : '';
    }

    public function render(): void {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        $settings = get_option( self::OPTION, self::DEFAULTS );
        $key_configured = ! empty( $settings['api_key'] );
        $chosen_provider = self::chosen_provider();
        $chosen_ai_provider = self::chosen_ai_provider();
        $wp_ai_available = LC_Provider_WP_AI::available();
        $wp_ai_configured = LC_Provider_WP_AI::configured();
        $configured_ai_providers = LC_Provider_WP_AI::configured_providers();
        include LC_PATH . 'admin/settings-page.php';
    }
}
