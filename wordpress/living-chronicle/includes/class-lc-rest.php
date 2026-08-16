<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_REST {
    public function __construct( private LC_Story_Controller $controller, private string $provider_id = 'local', private string $ai_provider = '' ) {}
    public function register(): void {
        register_rest_route( 'lc/v1', '/story', array( 'methods' => WP_REST_Server::CREATABLE, 'callback' => array( $this->controller, 'handle' ), 'permission_callback' => array( $this, 'story_permission' ) ) );
        register_rest_route( 'lc/v1', '/health', array( 'methods' => WP_REST_Server::READABLE, 'callback' => array( $this, 'health' ), 'permission_callback' => array( $this, 'public_permission' ) ) );
    }
    public function story_permission( WP_REST_Request $request ): true|WP_Error {
        $nonce = $request->get_header( 'X-WP-Nonce' );
        return $nonce && wp_verify_nonce( $nonce, 'wp_rest' ) ? true : new WP_Error( 'lc_invalid_nonce', __( 'Story request could not be verified.', 'living-chronicle' ), array( 'status' => 403 ) );
    }
    public function public_permission(): bool { return true; }
    /** Public, so it names the connector in use but never anything about its credentials. */
    public function health(): WP_REST_Response { $response = new WP_REST_Response( array( 'ok' => true, 'schema_version' => 1, 'provider' => $this->provider_id, 'ai_provider' => $this->ai_provider ), 200 ); $response->header( 'Cache-Control', 'no-store' ); return $response; }
}
