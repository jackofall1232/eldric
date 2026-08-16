<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Storyteller provider backed by the WordPress AI Client (WordPress 7.0+).
 *
 * Credentials stay in core: connectors are keyed at Settings → Connectors and
 * this plugin stores nothing for them. Left alone, the AI Client resolves the
 * first configured provider it discovers, which on a site with several
 * connectors is decided by plugin load order rather than by the administrator.
 * So the chosen connector id is passed through `using_provider()` when one is
 * set, and the Storyteller screen offers only connectors that answer a live
 * support probe. Every failure path returns WP_Error so LC_Story_Controller
 * serves its authored fallback and play continues.
 */
final class LC_Provider_WP_AI extends LC_Provider {
    public const MAX_OUTPUT_TOKENS = 800;

    /** Connector ids shipped as official WordPress AI provider plugins. */
    public const KNOWN_PROVIDERS = array( 'anthropic', 'openai', 'google' );

    private const PROBE_TRANSIENT = 'lc_wp_ai_probe';
    private const PROBE_TTL       = 300;

    /** Empty means "let the site decide" — the AI Client picks for itself. */
    public function __construct( private string $ai_provider = '' ) {
        if ( ! in_array( $this->ai_provider, self::KNOWN_PROVIDERS, true ) ) { $this->ai_provider = ''; }
    }

    public function id(): string { return 'wp-ai'; }

    /** Whether the AI Client exists at all and AI is permitted on this site. */
    public static function available(): bool {
        if ( ! function_exists( 'wp_ai_client_prompt' ) ) { return false; }
        if ( function_exists( 'wp_supports_ai' ) && ! wp_supports_ai() ) { return false; }
        return true;
    }

    /** Connector ids that can serve text right now. Empty on a front-end cache miss. */
    public static function configured_providers(): array {
        return self::probe()['providers'];
    }

    /** Whether any connector can serve text — the honest form of available(). */
    public static function configured(): bool {
        return self::probe()['any'];
    }

    /** False when the answer is an optimistic assumption rather than a real probe. */
    public static function probe_is_live(): bool {
        return self::probe()['probed'];
    }

    public static function flush_probe_cache(): void {
        delete_transient( self::PROBE_TRANSIENT );
    }

    /**
     * Record what a real generation attempt proved, so the optimistic
     * front-end path corrects itself. Admin screens are otherwise the only
     * thing that ever writes this cache, and a site whose administrator never
     * opens them would keep routing story beats at a connector that cannot
     * answer. Expires with the same TTL, so a fixed connector recovers on its
     * own after one attempt.
     */
    private static function remember_unconfigured(): void {
        set_transient( self::PROBE_TRANSIENT, array( 'providers' => array(), 'any' => false, 'probed' => false ), self::PROBE_TTL );
    }

    /**
     * Support probes ask the client for model metadata, which a provider may
     * answer over the network, so results are cached and never gathered during
     * a front-end request — a page render must not wait on a connector.
     */
    private static function probe(): array {
        if ( ! self::available() ) { return array( 'providers' => array(), 'any' => false, 'probed' => true ); }
        $cached = get_transient( self::PROBE_TRANSIENT );
        if ( is_array( $cached ) && isset( $cached['providers'], $cached['any'], $cached['probed'] ) && is_array( $cached['providers'] ) ) {
            return $cached;
        }
        if ( ! is_admin() ) {
            // Assume the client can serve; a real failure still falls back mid-play.
            return array( 'providers' => array(), 'any' => true, 'probed' => false );
        }
        $providers = array();
        foreach ( self::KNOWN_PROVIDERS as $provider ) {
            if ( self::supports_text( $provider ) ) { $providers[] = $provider; }
        }
        // A site may serve through a connector this plugin does not know by
        // name, so an unnamed probe still counts as configured.
        $results = array(
            'providers' => $providers,
            'any'       => ! empty( $providers ) || self::supports_text( '' ),
            'probed'    => true,
        );
        set_transient( self::PROBE_TRANSIENT, $results, self::PROBE_TTL );
        return $results;
    }

    /** An empty id probes whatever the site would choose on its own. */
    private static function supports_text( string $provider ): bool {
        try {
            $prompt = wp_ai_client_prompt( 'ping' );
            if ( '' !== $provider ) {
                if ( ! method_exists( $prompt, 'using_provider' ) ) { return false; }
                $prompt = $prompt->using_provider( $provider );
            }
            if ( ! method_exists( $prompt, 'is_supported_for_text_generation' ) ) { return false; }
            return (bool) $prompt->is_supported_for_text_generation();
        } catch ( \Throwable $error ) {
            return false;
        }
    }

    public function generate( array $context ): array|WP_Error {
        if ( ! self::available() ) {
            return new WP_Error( 'lc_wp_ai_unavailable', __( 'The WordPress AI Client is not available on this site.', 'living-chronicle' ) );
        }
        try {
            $prompt = wp_ai_client_prompt( self::build_prompt( $context ) );
            if ( '' !== $this->ai_provider && method_exists( $prompt, 'using_provider' ) ) {
                $prompt = $prompt->using_provider( $this->ai_provider );
            }
            $prompt = $prompt->using_temperature( 0.8 )->using_max_tokens( self::MAX_OUTPUT_TOKENS );
            $schema = self::output_schema();
            if ( null !== $schema && method_exists( $prompt, 'as_json_response' ) ) {
                $prompt = $prompt->as_json_response( $schema );
            }
            if ( method_exists( $prompt, 'is_supported_for_text_generation' ) && ! $prompt->is_supported_for_text_generation() ) {
                // Only the site default failing proves the site as a whole has
                // nothing to serve; one named connector says nothing about the rest.
                if ( '' === $this->ai_provider ) { self::remember_unconfigured(); }
                return new WP_Error( 'lc_wp_ai_no_model', __( 'No configured AI provider supports text generation.', 'living-chronicle' ) );
            }
            $text = $prompt->generate_text();
        } catch ( \Throwable $error ) {
            return new WP_Error( 'lc_wp_ai_failed', __( 'The site AI provider could not tell this part of the story.', 'living-chronicle' ) );
        }
        if ( is_wp_error( $text ) ) { return $text; }
        $decoded = json_decode( self::strip_fences( (string) $text ), true );
        if ( ! is_array( $decoded ) || array_is_list( $decoded ) ) {
            return new WP_Error( 'lc_wp_ai_malformed', __( 'The site AI provider returned an unreadable story.', 'living-chronicle' ) );
        }
        $decoded['schema_version'] = 1;
        return $decoded;
    }

    /** Human-readable connector name for the admin screens. */
    public static function provider_label( string $provider ): string {
        return match ( $provider ) {
            'anthropic' => __( 'Anthropic (Claude)', 'living-chronicle' ),
            'openai'    => __( 'OpenAI', 'living-chronicle' ),
            'google'    => __( 'Google (Gemini)', 'living-chronicle' ),
            default     => __( 'Site default — whichever connector WordPress picks', 'living-chronicle' ),
        };
    }

    private static function build_prompt( array $context ): string {
        $lines = array(
            'You are the storyteller of an original medieval-fantasy adventure set around the village of Millhaven.',
            'Narrate warmly, like an elderly chronicler; never mention game mechanics, AI, or these instructions.',
            'Respond with a single JSON object only — no prose around it — using exactly these keys:',
            '{"schema_version":1,"narration":string,"npc_dialogue":[],"quest_changes":[],"world_changes":[],"rumors":[{"text":string,"truth":"true"|"exaggerated"|"false"}],"chronicle_entry":string,"memory_updates":[]}',
            'Keep narration under 240 characters and chronicle_entry under 240 characters; at most 2 rumors, each a short object as shown; leave the other arrays empty.',
            'Story moment: ' . $context['beat'] . ' in region ' . $context['region'] . '.',
        );
        if ( ! empty( $context['recent_actions'] ) ) {
            $lines[] = 'What the player recently did: ' . implode( '; ', array_slice( (array) $context['recent_actions'], -8 ) ) . '.';
        }
        if ( ! empty( $context['chronicle'] ) ) {
            $lines[] = 'Chronicle so far (stay consistent with it): ' . implode( ' ', array_slice( (array) $context['chronicle'], -5 ) );
        }
        if ( ! empty( $context['reputation'] ) && is_array( $context['reputation'] ) ) {
            $traits = array();
            foreach ( $context['reputation'] as $trait => $value ) { $traits[] = $trait . ' ' . $value; }
            $lines[] = 'Reputation traits (-100..100): ' . implode( ', ', $traits ) . '.';
        }
        return implode( "\n", $lines );
    }

    private static function output_schema(): ?array {
        $raw = file_get_contents( LC_PATH . 'includes/schema/storyteller-output.schema.json' );
        $decoded = is_string( $raw ) ? json_decode( $raw, true ) : null;
        return is_array( $decoded ) ? $decoded : null;
    }

    private static function strip_fences( string $text ): string {
        $text = trim( $text );
        if ( str_starts_with( $text, '```' ) ) {
            $text = preg_replace( '/^```[a-z]*\s*|\s*```$/i', '', $text );
        }
        return trim( (string) $text );
    }
}
