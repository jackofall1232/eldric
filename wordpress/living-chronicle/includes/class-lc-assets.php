<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Assets {
    public const SCRIPT = 'lc-eldric-game';
    public const STYLE = 'lc-eldric-game';
    private bool $loader_added = false;

    public function register(): void {
        wp_register_style( self::STYLE, LC_URL . 'assets/build/eldric-living-chronicle.css', array(), LC_VERSION );
        wp_register_script( self::SCRIPT, LC_URL . 'assets/build/eldric-living-chronicle.js', array(), LC_VERSION, true );
    }

    public function enqueue(): void {
        if ( ! wp_style_is( self::STYLE, 'registered' ) ) { $this->register(); }
        wp_enqueue_style( self::STYLE );
        wp_enqueue_script( self::SCRIPT );
        if ( $this->loader_added ) { return; }
        $this->loader_added = true;
        wp_add_inline_script(
            self::SCRIPT,
            '(function(){function lcBoot(){if(window.EldricLivingChronicle){window.EldricLivingChronicle.mountAll(document);}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",lcBoot,{once:true});}else{lcBoot();}}());',
            'after'
        );
    }
}
