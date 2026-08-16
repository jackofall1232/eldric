<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Logger {
    public static function event( string $event, string $status, int $latency_ms = 0 ): void {
        if ( ! defined( 'WP_DEBUG' ) || ! WP_DEBUG ) { return; }
        $event = preg_replace( '/[^a-z0-9_-]/i', '', $event ); $status = preg_replace( '/[^a-z0-9_-]/i', '', $status );
        error_log( sprintf( '[eldric] event=%s status=%s latency_ms=%d', $event, $status, max( 0, min( 30000, $latency_ms ) ) ) );
    }
}
