<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'market4tell' );

/** MySQL database username */
define( 'DB_USER', 'root' );

/** MySQL database password */
define( 'DB_PASSWORD', 'root' );

/** MySQL hostname */
define( 'DB_HOST', 'localhost' );

/** Database Charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The Database Collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '^gb7<:tU5P`f+jOy,P~J(:lh}6mAxxg5uT*ImGSxX%2AIvwt> m-ex4QmqwQ-SBe' );
define( 'SECURE_AUTH_KEY',  'zzq3}5!(.-0?E5ZXoxxAq_8[b~L_r<9$xM]<N8B7N*0Sbbgf;ck5FW3MxT~q%zc)' );
define( 'LOGGED_IN_KEY',    'U2rZMyF(*D=v+5&* ]Dor@jh.ao(_!}Z6FsWq8 A-cP %V-1]Z$HCM8qNtBf<HYX' );
define( 'NONCE_KEY',        '+HO6Bc2;2@Uav5<R|=r248xSOFO8`Rl!rIdH)2 n5mK:U@SHh$/EBo4RAhr%A!)l' );
define( 'AUTH_SALT',        'A.d[0Fc`k7*J36m?|VSM7mWb2C{xxtnI5qYiK&dU,GmE58S-MM/v=y rR#+[XZ^Z' );
define( 'SECURE_AUTH_SALT', 'B2e8l>kn0nroI9{@U6Lsfy9H< Tm4h^aB%l7|6mlxmw^lNl/XDG%Lt3T6epzFAP$' );
define( 'LOGGED_IN_SALT',   '{;f-Xly#Hp~M+7DW 58%%EBMXk5+!]?Oyg2S+Rd:[4vTig8RVw!gm@c&qzTe~+hA' );
define( 'NONCE_SALT',       '5{y9<{pcO0v;advgUVq >h!CoVv>f;`E!_/H77*_^Z5GVb_JKnd>?|1AF=4CrV++' );

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define( 'WP_DEBUG', false );

/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', dirname( __FILE__ ) . '/' );
}

/** Sets up WordPress vars and included files. */
require_once( ABSPATH . 'wp-settings.php' );
