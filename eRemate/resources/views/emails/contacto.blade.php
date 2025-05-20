<!DOCTYPE html>
<html>
<head>
    <title>Gracias por contactarnos</title>
</head>
<body>
    <h1>Hola,</h1>
    <p>Hemos recibido tu consulta con los siguientes detalles:</p>
    <p><strong>De:</strong> {{ $from }}</p>
    <p><strong>Para:</strong> {{ $to }}</p>
    <p><strong>Asunto:</strong> {{ $subject }}</p>
    <p><strong>Mensaje:</strong></p>
    <blockquote>
        <p>{{ $body }}</p>
    </blockquote>
    <p>Nos pondremos en contacto contigo lo antes posible.</p>
    <p>Saludos,<br>El equipo de eRemate</p>
</body>
</html>
