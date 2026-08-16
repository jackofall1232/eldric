<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Plugin {
    private static ?LC_Plugin $instance = null;
    private bool $booted = false;

    public static function instance(): LC_Plugin {
        return self::$instance ??= new self();
    }

    public function boot(): void {
        if ( $this->booted ) { return; }
        $this->booted = true;
        $assets = new LC_Assets();
        $shortcode = new LC_Shortcode( $assets );
        $controller = new LC_Story_Controller( new LC_Provider_Local(), new LC_Rate_Limiter() );
        $rest = new LC_REST( $controller );
        $settings = new LC_Settings();
        add_action( 'wp_enqueue_scripts', array( $assets, 'register' ) );
        add_action( 'init', array( $shortcode, 'register' ) );
        add_action( 'rest_api_init', array( $rest, 'register' ) );
        add_action( 'admin_menu', array( $settings, 'add_page' ) );
        add_action( 'admin_init', array( $settings, 'register_setting' ) );
    }
}
