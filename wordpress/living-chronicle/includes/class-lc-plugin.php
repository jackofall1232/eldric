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
        add_action( 'wp_enqueue_scripts', array( $assets, 'register' ) );
        add_action( 'init', array( $shortcode, 'register' ) );
    }
}
