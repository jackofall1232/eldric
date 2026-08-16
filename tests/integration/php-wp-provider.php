<?php
/**
 * Harness: exercises provider selection and the WP AI provider against WordPress
 * stubs, printing JSON results for the node test wrapper. Not loaded by WordPress.
 */
define( 'ABSPATH', '/tmp/wp/' );
define( 'LC_PATH', dirname( __DIR__, 2 ) . '/wordpress/living-chronicle/' );
define( 'LC_URL', 'https://example.test/wp-content/plugins/living-chronicle/' );

$GLOBALS['lc_options'] = array();
$GLOBALS['lc_transients'] = array();
function get_option( $name, $default = false ) { return $GLOBALS['lc_options'][ $name ] ?? $default; }
function sanitize_key( $key ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $key ) ); }
function __( $text, $domain = 'default' ) { return $text; }
function wp_json_encode( $value, $flags = 0 ) { return json_encode( $value, $flags ); }
function sanitize_text_field( $value ) { return trim( preg_replace( '/[\r\n\t ]+/', ' ', (string) $value ) ); }
function wp_unslash( $value ) { return is_string( $value ) ? stripslashes( $value ) : $value; }
function esc_url_raw( $url ) { return $url; }
function get_transient( $name ) { return $GLOBALS['lc_transients'][ $name ] ?? false; }
function set_transient( $name, $value, $ttl = 0 ) { $GLOBALS['lc_transients'][ $name ] = $value; return true; }
function delete_transient( $name ) { unset( $GLOBALS['lc_transients'][ $name ] ); return true; }
// Admin context, so availability probes actually run rather than assuming.
function is_admin() { return true; }

class WP_Error {
    public function __construct( public string $code = '', public string $message = '', public mixed $data = null ) {}
    public function get_error_code() { return $this->code; }
}
function is_wp_error( $thing ) { return $thing instanceof WP_Error; }

require LC_PATH . 'includes/class-lc-sanitizer.php';
require LC_PATH . 'includes/class-lc-validator.php';
require LC_PATH . 'includes/providers/class-lc-provider.php';
require LC_PATH . 'includes/class-lc-story-controller.php';
require LC_PATH . 'includes/providers/class-lc-provider-local.php';
require LC_PATH . 'includes/providers/class-lc-provider-wp-ai.php';
require LC_PATH . 'includes/class-lc-settings.php';

$results = array();
$context = array(
    'schema_version' => 1,
    'beat' => 'CAMPFIRE_REST',
    'region' => 'millhaven',
    'recent_actions' => array( 'millhaven_saved' ),
    'chronicle' => array( 'Eldric reached Millhaven.' ),
    'reputation' => array( 'honor' => 5 ),
);

// 1. Defaults: local chosen, local active, wp-ai unavailable.
$results['default_chosen'] = LC_Settings::chosen_provider();
$results['default_active'] = LC_Settings::active_provider();
$results['wp_ai_available_before'] = LC_Provider_WP_AI::available();

// 2. wp-ai chosen while the AI Client is absent: active falls back to local,
//    and the provider itself returns WP_Error rather than throwing.
$GLOBALS['lc_options'][ LC_Settings::OPTION ] = array( 'provider' => 'wp-ai', 'ai_provider' => '', 'api_key' => '' );
$results['chosen_wp_ai'] = LC_Settings::chosen_provider();
$results['active_without_client'] = LC_Settings::active_provider();
$unavailable = ( new LC_Provider_WP_AI() )->generate( $context );
$results['unavailable_is_error'] = is_wp_error( $unavailable );

// 3. Simulate the WordPress 7.0 AI Client with a fluent stub.
class LC_Test_Prompt {
    public static string $mode = 'ok';
    /** Connector ids that answer a support probe on this simulated site. */
    public static array $configured = array( 'anthropic', 'openai' );
    /** Connector id the last builder chain asked for; null means none was named. */
    public static ?string $last_provider = null;
    private ?string $provider = null;
    public array $calls = array();
    public function using_provider( $id ) { $this->provider = (string) $id; self::$last_provider = (string) $id; $this->calls[] = 'provider'; return $this; }
    public function using_temperature( $t ) { $this->calls[] = 'temperature'; return $this; }
    public function using_max_tokens( $t ) { $this->calls[] = 'max_tokens'; return $this; }
    public function as_json_response( $schema ) { $this->calls[] = 'json:' . ( is_array( $schema ) ? 'schema' : 'none' ); return $this; }
    public function is_supported_for_text_generation() {
        if ( 'unsupported' === self::$mode ) { return false; }
        if ( null === $this->provider ) { return ! empty( self::$configured ); }
        return in_array( $this->provider, self::$configured, true );
    }
    public function generate_text() {
        return match ( self::$mode ) {
            'ok' => "```json\n" . json_encode( array(
                'schema_version' => 1,
                'narration' => 'The fire settled, and the storyteller smiled at what Eldric had carried home.',
                'npc_dialogue' => array(), 'quest_changes' => array(), 'world_changes' => array(),
                'rumors' => array( array( 'text' => 'They say the millers sing again.', 'truth' => 'exaggerated' ) ),
                'chronicle_entry' => 'A quiet evening in Millhaven.',
                'memory_updates' => array(),
            ) ) . "\n```",
            'garbage' => 'Once upon a time (not JSON at all',
            'error' => new WP_Error( 'ai_down', 'provider offline' ),
            default => '',
        };
    }
}
// Conditional declaration so the function does not exist during the earlier
// availability checks (PHP compiles unconditional top-level functions eagerly).
if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
    function wp_ai_client_prompt( $text ) { $GLOBALS['lc_last_prompt'] = $text; return new LC_Test_Prompt(); }
}

LC_Provider_WP_AI::flush_probe_cache();
$results['active_with_client'] = LC_Settings::active_provider();
$provider = new LC_Provider_WP_AI();

LC_Test_Prompt::$mode = 'ok';
$generated = $provider->generate( $context );
$results['generate_ok_is_array'] = is_array( $generated );
$validated = is_array( $generated ) ? LC_Validator::output( $generated ) : array( 'valid' => false );
$results['generate_ok_validates'] = (bool) $validated['valid'];
$results['prompt_mentions_beat'] = str_contains( (string) $GLOBALS['lc_last_prompt'], 'CAMPFIRE_REST' );
$results['prompt_mentions_chronicle'] = str_contains( (string) $GLOBALS['lc_last_prompt'], 'Eldric reached Millhaven.' );

LC_Test_Prompt::$mode = 'garbage';
$results['garbage_is_error'] = is_wp_error( $provider->generate( $context ) );

LC_Test_Prompt::$mode = 'error';
$results['provider_error_passthrough'] = is_wp_error( $provider->generate( $context ) );

// 4. Settings sanitize keeps only known providers.
$settings = new LC_Settings();
$results['sanitize_unknown_provider'] = $settings->sanitize( array( 'provider' => 'evil"><script>' ) )['provider'];
$results['sanitize_wp_ai'] = $settings->sanitize( array( 'provider' => 'wp-ai' ) )['provider'];
$results['sanitize_unknown_ai_provider'] = $settings->sanitize( array( 'ai_provider' => 'evil"><script>' ) )['ai_provider'];
$results['sanitize_known_ai_provider'] = $settings->sanitize( array( 'ai_provider' => 'openai' ) )['ai_provider'];

// 5. Connector discovery: only connectors that answer a probe are offered.
LC_Test_Prompt::$mode = 'ok';
LC_Test_Prompt::$configured = array( 'anthropic', 'openai' );
LC_Provider_WP_AI::flush_probe_cache();
$results['configured_providers'] = LC_Provider_WP_AI::configured_providers();
$results['configured_any'] = LC_Provider_WP_AI::configured();

// The probe is cached: flipping the simulated site without flushing changes nothing.
LC_Test_Prompt::$configured = array();
$results['configured_providers_cached'] = LC_Provider_WP_AI::configured_providers();
LC_Provider_WP_AI::flush_probe_cache();
$results['configured_none_after_flush'] = LC_Provider_WP_AI::configured();

// 6. With no connector able to serve, Site AI degrades to local rather than
//    claiming to work — the case a bare function_exists() check misses.
$GLOBALS['lc_options'][ LC_Settings::OPTION ] = array( 'provider' => 'wp-ai', 'ai_provider' => '', 'api_key' => '' );
LC_Provider_WP_AI::flush_probe_cache();
$results['active_without_connector'] = LC_Settings::active_provider();

// 7. The chosen connector reaches the builder, and an unconfigured choice
//    resolves back to the site default instead of failing.
LC_Test_Prompt::$configured = array( 'anthropic', 'openai' );
LC_Provider_WP_AI::flush_probe_cache();
$GLOBALS['lc_options'][ LC_Settings::OPTION ] = array( 'provider' => 'wp-ai', 'ai_provider' => 'openai', 'api_key' => '' );
$results['chosen_ai_provider'] = LC_Settings::chosen_ai_provider();
$results['active_ai_provider'] = LC_Settings::active_ai_provider();
LC_Test_Prompt::$last_provider = null;
( new LC_Provider_WP_AI( LC_Settings::active_ai_provider() ) )->generate( $context );
$results['generate_used_provider'] = LC_Test_Prompt::$last_provider;

$GLOBALS['lc_options'][ LC_Settings::OPTION ] = array( 'provider' => 'wp-ai', 'ai_provider' => 'google', 'api_key' => '' );
$results['chosen_unconfigured_ai_provider'] = LC_Settings::chosen_ai_provider();
$results['active_unconfigured_falls_back'] = LC_Settings::active_ai_provider();
LC_Test_Prompt::$last_provider = null;
( new LC_Provider_WP_AI( LC_Settings::active_ai_provider() ) )->generate( $context );
$results['generate_default_names_no_provider'] = null === LC_Test_Prompt::$last_provider;

// 8. A connector id the plugin does not know is never smuggled into the builder.
LC_Test_Prompt::$last_provider = null;
( new LC_Provider_WP_AI( 'evil"><script>' ) )->generate( $context );
$results['unknown_provider_ignored'] = null === LC_Test_Prompt::$last_provider;

echo json_encode( $results );
