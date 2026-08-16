<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Settings {
    public const OPTION = 'lc_story_settings';
    public const PROVIDERS = array( 'local', 'wp-ai' );
    private const DEFAULTS = array( 'provider' => 'local', 'api_key' => '' );

    public function register_setting(): void {
        register_setting( 'lc_story', self::OPTION, array( 'type' => 'array', 'sanitize_callback' => array( $this, 'sanitize' ), 'default' => self::DEFAULTS ) );
    }
    public function sanitize( mixed $submitted ): array {
        $existing = get_option( self::OPTION, self::DEFAULTS );
        $submitted = is_array( $submitted ) ? $submitted : array();
        $provider = sanitize_key( (string) ( $submitted['provider'] ?? $existing['provider'] ?? 'local' ) );
        if ( ! in_array( $provider, self::PROVIDERS, true ) ) { $provider = 'local'; }
        $key = (string) ( $existing['api_key'] ?? '' );
        if ( ! empty( $submitted['clear_key'] ) ) { $key = ''; }
        elseif ( isset( $submitted['api_key'] ) && '' !== trim( (string) $submitted['api_key'] ) ) { $key = substr( sanitize_text_field( wp_unslash( $submitted['api_key'] ) ), 0, 512 ); }
        return array( 'provider' => $provider, 'api_key' => $key );
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
        if ( 'wp-ai' === $provider && ! LC_Provider_WP_AI::available() ) { return 'local'; }
        return $provider;
    }

    public function render(): void {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        $settings = get_option( self::OPTION, self::DEFAULTS );
        $key_configured = ! empty( $settings['api_key'] );
        $chosen_provider = self::chosen_provider();
        $wp_ai_available = LC_Provider_WP_AI::available();
        include LC_PATH . 'admin/settings-page.php';
    }
}
