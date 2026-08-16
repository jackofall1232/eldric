<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Story_Controller {
    public function __construct( private LC_Provider $provider, private LC_Rate_Limiter $limiter ) {}
    public function handle( WP_REST_Request $request ): WP_REST_Response|WP_Error {
        $started = microtime( true ); $body = $request->get_body();
        if ( strlen( $body ) > LC_Validator::MAX_REQUEST_BYTES ) { return new WP_Error( 'lc_request_too_large', __( 'Story request is too large.', 'living-chronicle' ), array( 'status' => 413 ) ); }
        $params = $request->get_json_params(); $context = LC_Validator::context( $params );
        if ( ! $context['valid'] ) { return new WP_Error( 'lc_invalid_context', __( 'Story context is invalid.', 'living-chronicle' ), array( 'status' => 400 ) ); }
        $limited = $this->limiter->consume(); if ( is_wp_error( $limited ) ) { return $limited; }
        $raw = $this->provider->generate( $context['value'] );
        if ( is_wp_error( $raw ) || strlen( wp_json_encode( $raw ) ) > LC_Validator::MAX_RESPONSE_BYTES ) { $raw = self::fallback(); }
        $validated = LC_Validator::output( $raw );
        if ( ! $validated['valid'] ) { $validated = LC_Validator::output( self::fallback() ); }
        $response = new WP_REST_Response( $validated['value'], 200 );
        $response->header( 'Cache-Control', 'no-store, private' );
        LC_Logger::event( 'story', 'ok', (int) round( ( microtime( true ) - $started ) * 1000 ) );
        return $response;
    }
    public static function fallback( string $narration = 'The old storyteller pauses, then continues from memory.' ): array {
        return array( 'schema_version' => 1, 'narration' => $narration, 'npc_dialogue' => array(), 'quest_changes' => array(), 'world_changes' => array(), 'rumors' => array(), 'chronicle_entry' => '', 'memory_updates' => array() );
    }
}
