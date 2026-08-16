<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Server-side storage seam reserved for an authenticated cloud-save route. */
final class LC_Save {
    private const META_PREFIX = '_lc_save_';

    public function load( int $user_id, string $profile ): ?array {
        if ( $user_id <= 0 ) { return null; }
        $value = get_user_meta( $user_id, $this->key( $profile ), true );
        return is_array( $value ) ? $value : null;
    }

    public function store( int $user_id, string $profile, array $save ): bool {
        if ( $user_id <= 0 ) { return false; }
        $bounded = array_slice( $save, 0, 64, true );
        return false !== update_user_meta( $user_id, $this->key( $profile ), $bounded );
    }

    public function delete( int $user_id, string $profile ): bool {
        return $user_id > 0 && delete_user_meta( $user_id, $this->key( $profile ) );
    }

    private function key( string $profile ): string {
        $safe = sanitize_key( $profile );
        return self::META_PREFIX . ( $safe ?: 'default' );
    }
}
