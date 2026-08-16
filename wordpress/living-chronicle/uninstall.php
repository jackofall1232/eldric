<?php
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) { exit; }
delete_option( 'lc_story_settings' );
global $wpdb;
$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_lc_rate_%' OR option_name LIKE '_transient_timeout_lc_rate_%'" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
