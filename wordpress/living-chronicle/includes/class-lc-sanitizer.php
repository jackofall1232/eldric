<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Sanitizer {
    public static function text( mixed $value, int $maximum ): ?string {
        if ( ! is_string( $value ) || self::length( $value ) > $maximum ) { return null; }
        if ( preg_match( '/<[^>]+>|(?:javascript|data|vbscript)\s*:|\bon\w+\s*=|```/i', $value ) ) { return null; }
        $value = preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $value );
        return trim( (string) $value );
    }

    public static function id( mixed $value ): ?string {
        return is_string( $value ) && preg_match( '/^[a-z0-9][a-z0-9_-]{0,63}$/', $value ) ? $value : null;
    }

    private static function length( string $value ): int {
        return function_exists( 'mb_strlen' ) ? mb_strlen( $value, 'UTF-8' ) : strlen( $value );
    }
}
