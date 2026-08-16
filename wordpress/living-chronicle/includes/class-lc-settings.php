<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Settings {
    public const OPTION = 'lc_story_settings';
    public function register_setting(): void {
        register_setting( 'lc_story', self::OPTION, array( 'type' => 'array', 'sanitize_callback' => array( $this, 'sanitize' ), 'default' => array( 'provider' => 'local', 'api_key' => '' ) ) );
    }
    public function add_page(): void {
        add_options_page( __( 'Eldric Storyteller', 'living-chronicle' ), __( 'Eldric Storyteller', 'living-chronicle' ), 'manage_options', 'lc-storyteller', array( $this, 'render' ) );
    }
    public function sanitize( mixed $submitted ): array {
        $existing = get_option( self::OPTION, array( 'provider' => 'local', 'api_key' => '' ) );
        $submitted = is_array( $submitted ) ? $submitted : array();
        $key = (string) ( $existing['api_key'] ?? '' );
        if ( ! empty( $submitted['clear_key'] ) ) { $key = ''; }
        elseif ( isset( $submitted['api_key'] ) && '' !== trim( (string) $submitted['api_key'] ) ) { $key = substr( sanitize_text_field( wp_unslash( $submitted['api_key'] ) ), 0, 512 ); }
        return array( 'provider' => 'local', 'api_key' => $key );
    }
    public function render(): void {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        $settings = get_option( self::OPTION, array( 'provider' => 'local', 'api_key' => '' ) );
        $key_configured = ! empty( $settings['api_key'] );
        include LC_PATH . 'admin/settings-page.php';
    }
}
