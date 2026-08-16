<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Provider_Local extends LC_Provider {
    public function id(): string { return 'local'; }
    public function generate( array $context ): array|WP_Error {
        $lines = array(
            'REGION_ENTERED' => array( 'The road opened before Eldric, and Millhaven kept its counsel.', 'The forest gave way to chimney smoke and an unfinished tale.' ),
            'CAMPFIRE_REST' => array( 'At the fire, even small deeds cast long shadows.', 'The storyteller gathered the day’s loose ends beside the embers.' ),
            'MAJOR_DECISION' => array( 'The river received the choice without judgment.', 'What Eldric chose beneath Blackwater would outlive every witness.' ),
        );
        $choices = $lines[ $context['beat'] ] ?? array( 'The storyteller turns a weathered page and continues.' );
        $index = abs( crc32( wp_json_encode( $context ) ) ) % count( $choices );
        return LC_Story_Controller::fallback( $choices[ $index ] );
    }
}
