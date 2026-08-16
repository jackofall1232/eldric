<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
<div class="wrap lc-admin">
    <header class="lc-hero lc-hero-compact">
        <p class="lc-hero-kicker"><?php esc_html_e( 'Eldric', 'living-chronicle' ); ?></p>
        <h1><?php esc_html_e( 'Storyteller Settings', 'living-chronicle' ); ?></h1>
        <p class="lc-hero-lede"><?php esc_html_e( 'Choose who tells the story. The local storyteller requires no key or network access and is always the fallback: if a provider fails or is unavailable, the game keeps playing with authored storytelling.', 'living-chronicle' ); ?></p>
    </header>
    <hr class="wp-header-end">
    <?php settings_errors( 'lc_story' ); ?>
    <form action="options.php" method="post" class="lc-card lc-settings-form">
        <?php settings_fields( 'lc_story' ); ?>
        <div class="lc-field">
            <label for="lc-provider"><?php esc_html_e( 'Story provider', 'living-chronicle' ); ?></label>
            <select id="lc-provider" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[provider]">
                <option value="local" <?php selected( $chosen_provider, 'local' ); ?>><?php esc_html_e( 'Local storyteller (offline, no key)', 'living-chronicle' ); ?></option>
                <option value="wp-ai" <?php selected( $chosen_provider, 'wp-ai' ); ?> <?php disabled( ! $wp_ai_available ); ?>><?php esc_html_e( 'Site AI — WordPress AI Client', 'living-chronicle' ); ?></option>
            </select>
            <?php if ( $wp_ai_available ) : ?>
                <p class="lc-description"><?php esc_html_e( 'Site AI uses an AI connector configured for this WordPress site (Settings → Connectors). Requests go through this plugin’s server-side proxy with rate limiting and validation; no AI credential is ever sent to visitors’ browsers.', 'living-chronicle' ); ?></p>
            <?php else : ?>
                <p class="lc-description"><?php esc_html_e( 'Site AI requires WordPress 7.0+ with the built-in AI Client and a configured AI connector. It is unavailable on this site, so the local storyteller is used.', 'living-chronicle' ); ?></p>
            <?php endif; ?>
            <?php if ( 'wp-ai' === $chosen_provider && ! $wp_ai_available ) : ?>
                <p class="lc-description lc-warning"><?php esc_html_e( 'Site AI is selected but not available right now — the local storyteller is serving the story instead.', 'living-chronicle' ); ?></p>
            <?php elseif ( 'wp-ai' === $chosen_provider && ! $wp_ai_configured ) : ?>
                <p class="lc-description lc-warning"><?php esc_html_e( 'Site AI is selected but no AI connector on this site can generate text — the local storyteller is serving the story instead. Add a connector key under Settings → Connectors.', 'living-chronicle' ); ?></p>
            <?php endif; ?>
        </div>
        <?php if ( $wp_ai_available ) : ?>
        <div class="lc-field">
            <label for="lc-ai-provider"><?php esc_html_e( 'Which AI answers', 'living-chronicle' ); ?></label>
            <select id="lc-ai-provider" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[ai_provider]">
                <option value="" <?php selected( $chosen_ai_provider, '' ); ?>><?php echo esc_html( LC_Provider_WP_AI::provider_label( '' ) ); ?></option>
                <?php foreach ( LC_Provider_WP_AI::KNOWN_PROVIDERS as $lc_ai_provider ) :
                    $lc_connected = in_array( $lc_ai_provider, $configured_ai_providers, true ); ?>
                    <option value="<?php echo esc_attr( $lc_ai_provider ); ?>" <?php selected( $chosen_ai_provider, $lc_ai_provider ); ?>>
                        <?php echo esc_html( LC_Provider_WP_AI::provider_label( $lc_ai_provider ) . ( $lc_connected ? '' : ' — ' . __( 'not connected', 'living-chronicle' ) ) ); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <p class="lc-description">
                <?php esc_html_e( 'With more than one connector keyed, WordPress otherwise picks the first one it happens to load — which is decided by plugin order, not by you. Naming a connector here removes that guesswork.', 'living-chronicle' ); ?>
                <a href="<?php echo esc_url( admin_url( 'options-general.php?page=connectors' ) ); ?>"><?php esc_html_e( 'Manage connectors', 'living-chronicle' ); ?></a>
            </p>
            <?php if ( '' !== $chosen_ai_provider && ! in_array( $chosen_ai_provider, $configured_ai_providers, true ) ) : ?>
                <p class="lc-description lc-warning"><?php esc_html_e( 'That connector is not answering right now, so the site default is being used instead. Check its key under Settings → Connectors.', 'living-chronicle' ); ?></p>
            <?php endif; ?>
        </div>
        <?php endif; ?>
        <div class="lc-field">
            <label for="lc-api-key"><?php esc_html_e( 'Future provider key', 'living-chronicle' ); ?></label>
            <input id="lc-api-key" type="password" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[api_key]" value="" autocomplete="new-password" class="regular-text" />
            <p class="lc-description"><?php echo $key_configured ? esc_html__( 'A key is stored server-side only. Leave blank to keep it. Site AI does not use this key — it uses the site-wide AI connector.', 'living-chronicle' ) : esc_html__( 'No key is stored. Site AI does not need one — it uses the site-wide AI connector.', 'living-chronicle' ); ?></p>
            <?php if ( $key_configured ) : ?><label class="lc-clear-key"><input type="checkbox" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[clear_key]" value="1" /> <?php esc_html_e( 'Remove stored key', 'living-chronicle' ); ?></label><?php endif; ?>
        </div>
        <?php submit_button( __( 'Save Settings', 'living-chronicle' ) ); ?>
    </form>
</div>
