<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// Canal público para las subastas
Broadcast::channel('subasta.{id}', function ($user, $id) {
    return true; // Canal público, cualquiera puede suscribirse
});

// Canal para chats específicos
Broadcast::channel('chat.{id}', function ($user, $id) {
    return true;
});

// Canal para solicitudes de pago por chat
Broadcast::channel('payment-request.{id}', function ($user, $id) {
    return true;
});
