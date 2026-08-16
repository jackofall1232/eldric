<?php
define( 'ABSPATH', __DIR__ );
require_once __DIR__ . '/../../wordpress/living-chronicle/includes/class-lc-sanitizer.php';
require_once __DIR__ . '/../../wordpress/living-chronicle/includes/class-lc-validator.php';

$fixture_dir = __DIR__ . '/../fixtures/story/';
$valid = json_decode( file_get_contents( $fixture_dir . 'valid-minimal.json' ), true );
$health = json_decode( file_get_contents( $fixture_dir . 'malicious-set-health.json' ), true );
$injection = json_decode( file_get_contents( $fixture_dir . 'malicious-injection.json' ), true );
$unknown = json_decode( file_get_contents( $fixture_dir . 'invalid-unknown-action.json' ), true );
$context = array( 'context' => array( 'schema_version' => 1, 'beat' => 'CAMPFIRE_REST', 'region' => 'millhaven', 'recent_actions' => array(), 'chronicle' => array(), 'reputation' => array(), 'npc_memories' => array() ) );

echo json_encode( array(
    'valid' => LC_Validator::output( $valid ),
    'health' => LC_Validator::output( $health ),
    'injection' => LC_Validator::output( $injection ),
    'unknown' => LC_Validator::output( $unknown ),
    'context' => LC_Validator::context( $context ),
) );
