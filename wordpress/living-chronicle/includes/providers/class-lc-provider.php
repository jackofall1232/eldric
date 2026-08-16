<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

abstract class LC_Provider {
    public const TIMEOUT_SECONDS = 5;
    public const MAX_RESPONSE_BYTES = 32768;
    abstract public function generate( array $context ): array|WP_Error;
    abstract public function id(): string;
}
