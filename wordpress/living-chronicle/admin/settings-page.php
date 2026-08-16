<?php if ( ! defined( 'ABSPATH' ) ) { exit; } ?>
<div class="wrap">
    <h1><?php esc_html_e( 'Eldric Storyteller', 'living-chronicle' ); ?></h1>
    <p><?php esc_html_e( 'The local storyteller is active and requires no key or network access. A stored key is reserved for future server-side providers and is never sent to the browser.', 'living-chronicle' ); ?></p>
    <form action="options.php" method="post">
        <?php settings_fields( 'lc_story' ); ?>
        <table class="form-table" role="presentation">
            <tr><th scope="row"><?php esc_html_e( 'Provider', 'living-chronicle' ); ?></th><td><strong><?php esc_html_e( 'Local (offline)', 'living-chronicle' ); ?></strong></td></tr>
            <tr><th scope="row"><label for="lc-api-key"><?php esc_html_e( 'Future provider key', 'living-chronicle' ); ?></label></th><td>
                <input id="lc-api-key" type="password" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[api_key]" value="" autocomplete="new-password" class="regular-text" />
                <p class="description"><?php echo $key_configured ? esc_html__( 'A key is stored. Leave blank to keep it.', 'living-chronicle' ) : esc_html__( 'No key is stored.', 'living-chronicle' ); ?></p>
                <?php if ( $key_configured ) : ?><label><input type="checkbox" name="<?php echo esc_attr( LC_Settings::OPTION ); ?>[clear_key]" value="1" /> <?php esc_html_e( 'Remove stored key', 'living-chronicle' ); ?></label><?php endif; ?>
            </td></tr>
        </table>
        <?php submit_button(); ?>
    </form>
</div>
