<?php
/**
 * Plugin Name: Worldilm AI Hub WordPress Integration
 * Plugin URI: https://ai.studio/build
 * Description: Seamlessly integrates the premium Worldilm AI Hub into WordPress, supporting automatic user synchronization, custom shortcode embedding, and secure PHP authentication bridge.
 * Version: 1.0.0
 * Author: Worldilm AI
 * License: GPL2
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

// 1. Add settings page in WordPress Dashboard to configure the integration
add_action('admin_menu', 'worldilm_ai_add_admin_menu');
add_action('admin_init', 'worldilm_ai_settings_init');

function worldilm_ai_add_admin_menu() {
    add_menu_page(
        'Worldilm AI Config',
        'Worldilm AI',
        'manage_options',
        'worldilm_ai_hub',
        'worldilm_ai_options_page',
        'dashicons-superhero'
    );
}

function worldilm_ai_settings_init() {
    register_setting('worldilm_ai_plugin_page', 'worldilm_ai_settings');

    add_settings_section(
        'worldilm_ai_plugin_page_section',
        __('General Settings', 'worldilm-ai'),
        'worldilm_ai_settings_section_callback',
        'worldilm_ai_plugin_page'
    );

    add_settings_field(
        'worldilm_ai_app_url',
        __('Application URL', 'worldilm-ai'),
        'worldilm_ai_app_url_render',
        'worldilm_ai_plugin_page',
        'worldilm_ai_plugin_page_section'
    );

    add_settings_field(
        'worldilm_ai_shared_secret',
        __('Shared Signing Secret (HMAC)', 'worldilm-ai'),
        'worldilm_ai_shared_secret_render',
        'worldilm_ai_plugin_page',
        'worldilm_ai_plugin_page_section'
    );
}

function worldilm_ai_app_url_render() {
    $options = get_option('worldilm_ai_settings');
    $val = isset($options['worldilm_ai_app_url']) ? esc_url($options['worldilm_ai_app_url']) : '';
    echo "<input type='text' name='worldilm_ai_settings[worldilm_ai_app_url]' value='{$val}' style='width: 400px;' placeholder='https://ais-dev-your-app-id.run.app' />";
    echo "<p class='description'>Provide the deployed React Cloud Run or preview application URL here.</p>";
}

function worldilm_ai_shared_secret_render() {
    $options = get_option('worldilm_ai_settings');
    $val = isset($options['worldilm_ai_shared_secret']) ? esc_attr($options['worldilm_ai_shared_secret']) : '';
    if (empty($val)) {
        $val = bin2hex(random_bytes(16)); // Auto-generate secure secret
    }
    echo "<input type='text' name='worldilm_ai_settings[worldilm_ai_shared_secret]' value='{$val}' style='width: 400px; font-family: monospace;' />";
    echo "<p class='description'>HMAC secret key used to sign WordPress user details securely when embedding the iframe.</p>";
}

function worldilm_ai_settings_section_callback() {
    echo __('Configure your Worldilm AI application settings below to enable instant iframe rendering and secure single-sign-on (SSO) bridging.', 'worldilm-ai');
}

function worldilm_ai_options_page() {
    ?>
    <div class="wrap">
        <form action='options.php' method='post'>
            <h1>Worldilm AI Hub Integration</h1>
            <?php
            settings_fields('worldilm_ai_plugin_page');
            do_settings_sections('worldilm_ai_plugin_page');
            submit_button();
            ?>
        </form>
        <hr style="margin: 30px 0;" />
        <h2>Integration Guide</h2>
        <p>This plugin exposes the <code>[worldilm_app]</code> shortcode. Add this shortcode to any WordPress post or page to render the premium Worldilm AI hub.</p>
        <p><strong>Example shortcode usage:</strong></p>
        <pre style="background: #f1f1f1; padding: 10px; border-radius: 5px; font-family: monospace;">[worldilm_app height="750px"]</pre>
        <p><strong>How the PHP Single Sign-On (SSO) works:</strong></p>
        <ul>
            <li>When a WordPress user visits the page with the shortcode, the plugin extracts their details (Email, User ID, and Display Name).</li>
            <li>It signs these details using your <strong>Shared Signing Secret</strong> using HMAC-SHA256.</li>
            <li>The details are securely passed as query parameters in the iframe URL.</li>
            <li>The embedded React App automatically reads these signed parameters, verifies the HMAC integrity, and logs them in instantly!</li>
        </ul>
    </div>
    <?php
}

// 2. Shortcode to render and authenticate the Worldilm AI hub iframe
add_shortcode('worldilm_app', 'worldilm_ai_shortcode_render');

function worldilm_ai_shortcode_render($atts) {
    // Merge shortcode attributes with defaults
    $args = shortcode_atts(array(
        'height' => '750px'
    ), $atts);

    $options = get_option('worldilm_ai_settings');
    $app_url = isset($options['worldilm_ai_app_url']) ? rtrim($options['worldilm_ai_app_url'], '/') : '';

    if (empty($app_url)) {
        return "<div style='padding: 20px; background: #fff1f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 12px; font-family: sans-serif;'>
            <strong>Configuration Needed:</strong> Please set the Worldilm AI Application URL inside your WordPress dashboard settings page.
        </div>";
    }

    $current_user = wp_get_current_user();
    
    // Default guest parameters if not logged in
    $wp_uid = "guest";
    $wp_email = "guest@wordpress.local";
    $wp_name = "Guest User";
    $wp_roles = "guest";

    if ($current_user->ID !== 0) {
        $wp_uid = $current_user->ID;
        $wp_email = $current_user->user_email;
        $wp_name = !empty($current_user->display_name) ? $current_user->display_name : $current_user->user_login;
        $wp_roles = implode(',', $current_user->roles);
    }

    // Securely Sign parameters with HMAC using PHP
    $secret = isset($options['worldilm_ai_shared_secret']) ? $options['worldilm_ai_shared_secret'] : 'secret';
    $timestamp = time();
    
    $payload = "uid=" . $wp_uid . "&email=" . $wp_email . "&name=" . $wp_name . "&roles=" . $wp_roles . "&timestamp=" . $timestamp;
    $signature = hash_hmac('sha256', $payload, $secret);

    // Build signed query URL
    $params = array(
        'sso_uid'       => $wp_uid,
        'sso_email'     => $wp_email,
        'sso_name'      => $wp_name,
        'sso_roles'     => $wp_roles,
        'sso_timestamp' => $timestamp,
        'sso_sig'       => $signature
    );

    $iframe_src = $app_url . '?' . http_build_query($params);

    // Render iframe container
    ob_start();
    ?>
    <div class="worldilm-iframe-container" style="width: 100%; border: none; overflow: hidden; margin: 15px 0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); background: #f8fafc;">
        <iframe 
            src="<?php echo esc_url($iframe_src); ?>" 
            width="100%" 
            height="<?php echo esc_attr($args['height']); ?>" 
            style="border: none; width: 100%; display: block; overflow: hidden;" 
            allow="camera; microphone; geolocation"
            id="worldilm-ai-hub-iframe"
        ></iframe>
    </div>
    <script>
        // Adjust Iframe communications if needed
        window.addEventListener('message', function(event) {
            // Keep this available for custom messages between WordPress parent window and the AI Hub
        });
    </script>
    <?php
    return ob_get_clean();
}
