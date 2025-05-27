<?php
// Simple script to generate Laravel application key
$key = 'base64:' . base64_encode(random_bytes(32));
echo "Generated APP_KEY: " . $key . "\n";

// Read current .env file
$envFile = '.env';
$envContents = file_get_contents($envFile);

// Replace empty APP_KEY
$envContents = preg_replace('/^APP_KEY=.*$/m', 'APP_KEY=' . $key, $envContents);

// Write back to .env file
file_put_contents($envFile, $envContents);

echo "APP_KEY updated in .env file\n";
?>
