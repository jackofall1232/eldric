<?php
if ( ! defined( 'ABSPATH' ) ) { exit; }

final class LC_Validator {
    public const SCHEMA_VERSION = 1;
    public const MAX_REQUEST_BYTES = 16384;
    public const MAX_RESPONSE_BYTES = 32768;
    private const TOP = array( 'schema_version', 'narration', 'npc_dialogue', 'quest_changes', 'world_changes', 'rumors', 'chronicle_entry', 'memory_updates' );
    private const QUEST_ACTIONS = array( 'ADD', 'ADVANCE', 'COMPLETE', 'FAIL' );
    private const OBJECTIVES = array( 'GO_TO', 'TALK_TO', 'FIND', 'COLLECT', 'DELIVER', 'DEFEAT', 'PROTECT', 'EXPLORE', 'CHOOSE' );
    private const WORLD_ACTIONS = array( 'SET_FLAG', 'DISCOVER_LOCATION', 'UNLOCK_DIALOGUE', 'ADD_RUMOR_SOURCE' );
    private const EMOTIONS = array( 'neutral', 'warm', 'wary', 'angry', 'afraid', 'sorrowful', 'hopeful' );
    private const TRUTH = array( 'true', 'exaggerated', 'false' );
    private const MEMORY_TYPES = array( 'promise', 'insult', 'gift', 'debt', 'betrayal', 'rescue', 'conversation' );
    private const BEATS = array( 'REGION_ENTERED', 'CAMPFIRE_REST', 'IMPORTANT_NPC', 'DUNGEON_COMPLETE', 'MAJOR_DECISION', 'VILLAGE_RETURN', 'ARTIFACT_OPENED', 'CHAPTER_BEGIN' );
    private const TRAITS = array( 'honor', 'mercy', 'greed', 'courage', 'loyalty', 'infamy', 'mystery' );

    public static function context( mixed $request ): array {
        $errors = array();
        if ( ! self::shape( $request, array( 'context' ) ) || ! isset( $request['context'] ) || ! is_array( $request['context'] ) || array_is_list( $request['context'] ) ) {
            return self::invalid( 'invalid_request_shape' );
        }
        $context = $request['context'];
        $keys = array( 'schema_version', 'beat', 'region', 'recent_actions', 'chronicle', 'reputation', 'npc_memories' );
        if ( ! self::shape( $context, $keys ) || array_diff( $keys, array_keys( $context ) ) ) { return self::invalid( 'invalid_context_shape' ); }
        if ( 1 !== $context['schema_version'] || ! in_array( $context['beat'], self::BEATS, true ) || null === LC_Sanitizer::id( $context['region'] ) ) { return self::invalid( 'invalid_context_identity' ); }
        foreach ( array( 'recent_actions' => array( 20, 160 ), 'chronicle' => array( 30, 160 ), 'npc_memories' => array( 20, 200 ) ) as $key => $limits ) {
            if ( ! is_array( $context[ $key ] ) || count( $context[ $key ] ) > $limits[0] ) { $errors[] = 'invalid_' . $key; continue; }
            foreach ( $context[ $key ] as $value ) { if ( null === LC_Sanitizer::text( $value, $limits[1] ) ) { $errors[] = 'invalid_' . $key; break; } }
        }
        if ( ! is_array( $context['reputation'] ) || ( $context['reputation'] && array_is_list( $context['reputation'] ) ) || ! self::shape( $context['reputation'], self::TRAITS, true ) ) { $errors[] = 'invalid_reputation'; }
        else { foreach ( $context['reputation'] as $trait => $value ) { if ( ! in_array( $trait, self::TRAITS, true ) || ! is_int( $value ) || $value < -100 || $value > 100 ) { $errors[] = 'invalid_reputation'; break; } } }
        return $errors ? array( 'valid' => false, 'value' => null, 'errors' => array_values( array_unique( $errors ) ) ) : array( 'valid' => true, 'value' => $context, 'errors' => array() );
    }

    public static function output( mixed $raw ): array {
        if ( ! is_array( $raw ) || array_is_list( $raw ) || ! self::shape( $raw, self::TOP ) || array_diff( self::TOP, array_keys( $raw ) ) || 1 !== ( $raw['schema_version'] ?? null ) ) { return self::invalid( 'invalid_output_shape' ); }
        $errors = array();
        $value = array(
            'schema_version' => 1,
            'narration' => self::required_text( $raw['narration'], 2000, 'narration', $errors ),
            'npc_dialogue' => self::items( $raw['npc_dialogue'], 8, 'npc_dialogue', $errors, array( self::class, 'dialogue' ) ),
            'quest_changes' => self::items( $raw['quest_changes'], 6, 'quest_changes', $errors, array( self::class, 'quest' ), true ),
            'world_changes' => self::items( $raw['world_changes'], 8, 'world_changes', $errors, array( self::class, 'world' ), true ),
            'rumors' => self::items( $raw['rumors'], 8, 'rumors', $errors, array( self::class, 'rumor' ) ),
            'chronicle_entry' => self::required_text( $raw['chronicle_entry'], 1200, 'chronicle_entry', $errors ),
            'memory_updates' => self::items( $raw['memory_updates'], 12, 'memory_updates', $errors, array( self::class, 'memory' ) ),
        );
        return $errors ? array( 'valid' => false, 'value' => null, 'errors' => $errors ) : array( 'valid' => true, 'value' => $value, 'errors' => array() );
    }

    private static function dialogue( mixed $item, int $index, array &$errors ): ?array {
        if ( ! self::shape( $item, array( 'npc_id', 'text', 'emotion' ) ) ) { $errors[] = "invalid_dialogue_$index"; return null; }
        $id = LC_Sanitizer::id( $item['npc_id'] ?? null ); $text = LC_Sanitizer::text( $item['text'] ?? null, 800 );
        if ( null === $id || null === $text || ( isset( $item['emotion'] ) && ! in_array( $item['emotion'], self::EMOTIONS, true ) ) ) { $errors[] = "invalid_dialogue_$index"; return null; }
        return array_filter( array( 'npc_id' => $id, 'text' => $text, 'emotion' => $item['emotion'] ?? null ), static fn( $v ) => null !== $v );
    }
    private static function quest( mixed $item, int $index, array &$errors ): ?array {
        if ( ! is_array( $item ) || ! in_array( $item['action'] ?? null, self::QUEST_ACTIONS, true ) ) { return null; }
        if ( ! self::shape( $item, array( 'action', 'quest_id', 'objective', 'target_id', 'text' ) ) ) { $errors[] = "invalid_quest_$index"; return null; }
        $id = LC_Sanitizer::id( $item['quest_id'] ?? null ); if ( null === $id ) { $errors[] = "invalid_quest_$index"; return null; }
        if ( isset( $item['objective'] ) && ! in_array( $item['objective'], self::OBJECTIVES, true ) ) { return null; }
        $result = array( 'action' => $item['action'], 'quest_id' => $id );
        if ( isset( $item['objective'] ) ) { $result['objective'] = $item['objective']; }
        if ( isset( $item['target_id'] ) ) { $target = LC_Sanitizer::id( $item['target_id'] ); if ( null === $target ) { $errors[] = "invalid_quest_$index"; } else { $result['target_id'] = $target; } }
        if ( isset( $item['text'] ) ) { $text = LC_Sanitizer::text( $item['text'], 500 ); if ( null === $text ) { $errors[] = "invalid_quest_$index"; } else { $result['text'] = $text; } }
        return $result;
    }
    private static function world( mixed $item, int $index, array &$errors ): ?array {
        if ( ! is_array( $item ) || ! in_array( $item['action'] ?? null, self::WORLD_ACTIONS, true ) ) { return null; }
        if ( ! self::shape( $item, array( 'action', 'target_id', 'value' ) ) || null === ( $target = LC_Sanitizer::id( $item['target_id'] ?? null ) ) ) { $errors[] = "invalid_world_$index"; return null; }
        $result = array( 'action' => $item['action'], 'target_id' => $target );
        if ( array_key_exists( 'value', $item ) ) { if ( is_bool( $item['value'] ) ) { $result['value'] = $item['value']; } else { $text = LC_Sanitizer::text( $item['value'], 240 ); if ( null === $text ) { $errors[] = "invalid_world_$index"; } else { $result['value'] = $text; } } }
        return $result;
    }
    private static function rumor( mixed $item, int $index, array &$errors ): ?array {
        if ( ! self::shape( $item, array( 'text', 'truth', 'source_id' ) ) || ! in_array( $item['truth'] ?? null, self::TRUTH, true ) || null === ( $text = LC_Sanitizer::text( $item['text'] ?? null, 400 ) ) ) { $errors[] = "invalid_rumor_$index"; return null; }
        $result = array( 'text' => $text, 'truth' => $item['truth'] );
        if ( isset( $item['source_id'] ) ) { $source = LC_Sanitizer::id( $item['source_id'] ); if ( null === $source ) { $errors[] = "invalid_rumor_$index"; } else { $result['source_id'] = $source; } }
        return $result;
    }
    private static function memory( mixed $item, int $index, array &$errors ): ?array {
        if ( ! self::shape( $item, array( 'npc_id', 'type', 'value', 'sentiment' ) ) || null === ( $id = LC_Sanitizer::id( $item['npc_id'] ?? null ) ) || ! in_array( $item['type'] ?? null, self::MEMORY_TYPES, true ) || null === ( $text = LC_Sanitizer::text( $item['value'] ?? null, 240 ) ) ) { $errors[] = "invalid_memory_$index"; return null; }
        $result = array( 'npc_id' => $id, 'type' => $item['type'], 'value' => $text );
        if ( isset( $item['sentiment'] ) ) { if ( ! is_int( $item['sentiment'] ) || $item['sentiment'] < -3 || $item['sentiment'] > 3 ) { $errors[] = "invalid_memory_$index"; } else { $result['sentiment'] = $item['sentiment']; } }
        return $result;
    }
    private static function items( mixed $items, int $maximum, string $name, array &$errors, callable $mapper, bool $drop_unknown = false ): array {
        if ( ! is_array( $items ) || count( $items ) > $maximum ) { $errors[] = 'invalid_' . $name; return array(); }
        $result = array(); foreach ( $items as $index => $item ) { $mapped = $mapper( $item, $index, $errors ); if ( null !== $mapped ) { $result[] = $mapped; } elseif ( ! $drop_unknown && ! isset( $errors[ count( $errors ) - 1 ] ) ) { $errors[] = "invalid_{$name}_$index"; } } return $result;
    }
    private static function required_text( mixed $value, int $maximum, string $name, array &$errors ): string { $text = LC_Sanitizer::text( $value, $maximum ); if ( null === $text ) { $errors[] = 'invalid_' . $name; return ''; } return $text; }
    private static function shape( mixed $value, array $allowed, bool $allow_empty = false ): bool { return is_array( $value ) && ( $allow_empty && array() === $value || ! array_is_list( $value ) ) && ! array_diff( array_keys( $value ), $allowed ); }
    private static function invalid( string $error ): array { return array( 'valid' => false, 'value' => null, 'errors' => array( $error ) ); }
}
