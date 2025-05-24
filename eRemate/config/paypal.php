<?php

return [
    'client_id' => env('PAYPAL_CLIENT_ID'),
    'client_secret' => env('PAYPAL_CLIENT_SECRET'),
    'base_url' => env('PAYPAL_BASE_URL', 'https://api.sandbox.paypal.com'), // sandbox por defecto
    'currency' => env('PAYPAL_CURRENCY', 'USD'),
];
