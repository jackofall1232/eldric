<?php
/**
 * Plugin Name: Eldric: The Living Chronicle
 * Description: An original top-down storybook action-adventure embedded with [living_chronicle].
 * Version: 0.1.0
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * Author: Eldric Contributors
 * License: MIT
 * Text Domain: living-chronicle
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'LC_VERSION', '0.1.0' );
define( 'LC_PATH', plugin_dir_path( __FILE__ ) );
define( 'LC_URL', plugin_dir_url( __FILE__ ) );

require_once LC_PATH . 'includes/class-lc-assets.php';
require_once LC_PATH . 'includes/class-lc-shortcode.php';
require_once LC_PATH . 'includes/class-lc-sanitizer.php';
require_once LC_PATH . 'includes/class-lc-validator.php';
require_once LC_PATH . 'includes/class-lc-rate-limiter.php';
require_once LC_PATH . 'includes/class-lc-logger.php';
require_once LC_PATH . 'includes/providers/class-lc-provider.php';
require_once LC_PATH . 'includes/class-lc-story-controller.php';
require_once LC_PATH . 'includes/providers/class-lc-provider-local.php';
require_once LC_PATH . 'includes/class-lc-rest.php';
require_once LC_PATH . 'includes/class-lc-settings.php';
require_once LC_PATH . 'includes/class-lc-plugin.php';

LC_Plugin::instance()->boot();
