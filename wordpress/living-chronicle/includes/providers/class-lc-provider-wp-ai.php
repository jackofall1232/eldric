<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Storyteller provider backed by the WordPress AI Client (WordPress 7.0+).
 *
 * Uses the site's own AI connector configuration — whichever provider the
 * administrator wired up site-wide — through the core `wp_ai_client_prompt()`
 * abstraction. No credential is stored or read by this plugin for it, and the
 * response passes through LC_Validator before anything reaches the game.
 * Every failure path returns WP_Error so LC_Story_Controller serves its
 * authored fallback and play continues.
 */
final class LC_Provider_WP_AI extends LC_Provider {
    public const MAX_OUTPUT_TOKENS = 800;

    public function id(): string { return 'wp-ai'; }

    public static function available(): bool {
        return function_exists( 'wp_ai_client_prompt' );
    }

    public function generate( array $context ): array|WP_Error {
        if ( ! self::available() ) {
            return new WP_Error( 'lc_wp_ai_unavailable', __( 'The WordPress AI Client is not available on this site.', 'living-chronicle' ) );
        }
        try {
            $prompt = wp_ai_client_prompt( self::build_prompt( $context ) )
                ->using_temperature( 0.8 )
                ->using_max_tokens( self::MAX_OUTPUT_TOKENS );
            $schema = self::output_schema();
            if ( null !== $schema && method_exists( $prompt, 'as_json_response' ) ) {
                $prompt = $prompt->as_json_response( $schema );
            }
            if ( method_exists( $prompt, 'is_supported_for_text_generation' ) && ! $prompt->is_supported_for_text_generation() ) {
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
