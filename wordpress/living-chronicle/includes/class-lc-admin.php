<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * The top-level "Eldric" admin menu: a setup guide and the storyteller settings.
 * Presentation only — provider choice, sanitization and key handling stay in LC_Settings.
 */
final class LC_Admin {
    public const MENU_SLUG     = 'lc-eldric';
    public const SETTINGS_SLUG = 'lc-storyteller';
    public const STYLE         = 'lc-admin';

    private LC_Settings $settings;
    /** @var string[] Hook suffixes of this plugin's own admin screens. */
    private array $hooks = array();

    public function __construct( LC_Settings $settings ) {
        $this->settings = $settings;
    }

    public function register(): void {
        add_action( 'admin_menu', array( $this, 'add_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue' ) );
    }

    public function add_menu(): void {
        $guide = add_menu_page(
            __( 'Eldric: The Living Chronicle', 'living-chronicle' ),
            __( 'Eldric', 'living-chronicle' ),
            'manage_options',
            self::MENU_SLUG,
            array( $this, 'render_setup' ),
            self::menu_icon(),
            58
        );
        $setup = add_submenu_page(
            self::MENU_SLUG,
            __( 'Set Up the Game', 'living-chronicle' ),
            __( 'Setup Guide', 'living-chronicle' ),
            'manage_options',
            self::MENU_SLUG,
            array( $this, 'render_setup' )
        );
        $settings = add_submenu_page(
            self::MENU_SLUG,
            __( 'Storyteller Settings', 'living-chronicle' ),
            __( 'Storyteller', 'living-chronicle' ),
            'manage_options',
            self::SETTINGS_SLUG,
            array( $this, 'render_settings' )
        );
        $this->hooks = array_values( array_filter( array( $guide, $setup, $settings ) ) );
    }

    /** Style only this plugin's screens; never touch the rest of wp-admin. */
    public function enqueue( string $hook_suffix ): void {
        if ( ! in_array( $hook_suffix, $this->hooks, true ) ) { return; }
        wp_enqueue_style( self::STYLE, LC_URL . 'admin/css/lc-admin.css', array(), LC_VERSION );
    }

    public function render_setup(): void {
        if ( ! current_user_can( 'manage_options' ) ) { return; }
        $chosen_provider    = LC_Settings::chosen_provider();
        $active_provider    = LC_Settings::active_provider();
        $wp_ai_available    = LC_Provider_WP_AI::available();
        $wp_ai_configured   = LC_Provider_WP_AI::configured();
        $active_ai_provider = LC_Settings::active_ai_provider();
        $settings_url       = admin_url( 'admin.php?page=' . self::SETTINGS_SLUG );
        include LC_PATH . 'admin/setup-page.php';
    }

    public function render_settings(): void {
        if ( isset( $_GET['settings-updated'] ) && ! count( get_settings_errors( 'lc_story' ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- display-only flag set by options.php redirect.
            add_settings_error( 'lc_story', 'lc_story_saved', __( 'The storyteller heeds your wishes — settings saved.', 'living-chronicle' ), 'success' );
        }
        $this->settings->render();
    }

    /** Original open-book-and-flame mark; svg-painter recolors it to the admin scheme. */
    private static function menu_icon(): string {
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="black" d="M10 .9c1 1.2 2 2.3 2 3.6a2 2 0 1 1-4 0C8 3.2 9 2.1 10 .9zM9.3 8.7v9.2c-2.3-1.1-4.7-1.3-6.6-.7-.4.1-.7-.2-.7-.5V8.6c0-.3.2-.5.4-.6 2-.7 4.6-.4 6.9.7zm1.4 0c2.3-1.1 4.9-1.4 6.9-.7.2.1.4.3.4.6v8.1c0 .3-.3.6-.7.5-1.9-.6-4.3-.4-6.6.7V8.7zM1 10.3v8.2c0 .4.4.7.8.5 2.2-.8 5-.5 7.2.9.6.4 1.4.4 2 0 2.2-1.4 5-1.7 7.2-.9.4.2.8-.1.8-.5v-8.2h-.9v7.1c-2.3-.5-5 0-7.1 1.3-.6.4-1.4.4-2 0-2.1-1.3-4.8-1.8-7.1-1.3v-7.1H1z"/></svg>';
        return 'data:image/svg+xml;base64,' . base64_encode( $svg );
    }
}
