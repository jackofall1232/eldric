<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
<div class="wrap">
    <h1><?php esc_html_e( 'Eldric Storyteller', 'living-chronicle' ); ?></h1>
    <p><?php esc_html_e( 'Choose who tells the story. The local storyteller requires no key or network access and is always the fallback: if a provider fails or is unavailable, the game keeps playing with authored storytelling.', 'living-chronicle' ); ?></p>
    <form action="options.php" method="post">
        <?php settings_fields( 'lc_story' ); ?>
        <table class="form-table" role="presentation">
            <tr><th scope="row"><label for="lc-provider"><?php esc_html_e( 'Story provider', 'living-chronicle' ); ?></label></th><td>
                <select id="lc-provider" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[provider]">
                    <option value="local" <?php selected( $chosen_provider, 'local' ); ?>><?php esc_html_e( 'Local storyteller (offline, no key)', 'living-chronicle' ); ?></option>
                    <option value="wp-ai" <?php selected( $chosen_provider, 'wp-ai' ); ?> <?php disabled( ! $wp_ai_available ); ?>><?php esc_html_e( 'Site AI — WordPress AI Client', 'living-chronicle' ); ?></option>
                </select>
                <?php if ( $wp_ai_available ) : ?>
                    <p class="description"><?php esc_html_e( 'Site AI uses the AI provider configured for this WordPress site (Settings → AI). Requests go through this plugin’s server-side proxy with rate limiting and validation; no AI credential is ever sent to visitors’ browsers.', 'living-chronicle' ); ?></p>
                <?php else : ?>
                    <p class="description"><?php esc_html_e( 'Site AI requires WordPress 7.0+ with the built-in AI Client and a configured AI provider. It is unavailable on this site, so the local storyteller is used.', 'living-chronicle' ); ?></p>
                <?php endif; ?>
                <?php if ( 'wp-ai' === $chosen_provider && ! $wp_ai_available ) : ?>
                    <p class="description" style="color:#996800;"><?php esc_html_e( 'Site AI is selected but not available right now — the local storyteller is serving the story instead.', 'living-chronicle' ); ?></p>
                <?php endif; ?>
            </td></tr>
            <tr><th scope="row"><label for="lc-api-key"><?php esc_html_e( 'Future provider key', 'living-chronicle' ); ?></label></th><td>
                <input id="lc-api-key" type="password" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[api_key]" value="" autocomplete="new-password" class="regular-text" />
                <p class="description"><?php echo $key_configured ? esc_html__( 'A key is stored server-side only. Leave blank to keep it. Site AI does not use this key — it uses the site-wide AI connector.', 'living-chronicle' ) : esc_html__( 'No key is stored. Site AI does not need one — it uses the site-wide AI connector.', 'living-chronicle' ); ?></p>
                <?php if ( $key_configured ) : ?><label><input type="checkbox" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[clear_key]" value="1" /> <?php esc_html_e( 'Remove stored key', 'living-chronicle' ); ?></label><?php endif; ?>
            </td></tr>
        </table>
        <?php submit_button(); ?>
    </form>
</div>
