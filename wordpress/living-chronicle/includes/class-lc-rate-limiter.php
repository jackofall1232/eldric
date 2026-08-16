<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Rate_Limiter {
    private int $limit; private int $window;
    public function __construct( int $limit = 10, int $window = 60 ) { $this->limit = $limit; $this->window = $window; }
    public function consume(): true|WP_Error {
        $identity = get_current_user_id() ? 'u:' . get_current_user_id() : 'i:' . ( $_SERVER['REMOTE_ADDR'] ?? 'unknown' );
        $key = 'lc_rate_' . hash_hmac( 'sha256', $identity, wp_salt( 'nonce' ) );
        $now = time(); $bucket = get_transient( $key );
        if ( ! is_array( $bucket ) || ( $bucket['reset'] ?? 0 ) <= $now ) { $bucket = array( 'count' => 0, 'reset' => $now + $this->window ); }
        if ( $bucket['count'] >= $this->limit ) { return new WP_Error( 'lc_rate_limited', __( 'The storyteller is resting. Try again shortly.', 'living-chronicle' ), array( 'status' => 429, 'retry_after' => max( 1, $bucket['reset'] - $now ) ) ); }
        $bucket['count'] += 1;
        if ( false === set_transient( $key, $bucket, max( 1, $bucket['reset'] - $now ) ) ) { return new WP_Error( 'lc_rate_unavailable', __( 'Story service is temporarily unavailable.', 'living-chronicle' ), array( 'status' => 503 ) ); }
        return true;
    }
}
