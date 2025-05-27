@component('mail::message')
<div style="background: #f8fafc; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
    <h2 style="color: #2d3748; margin-bottom: 10px;">¡Hola, {{ $nombreRematador }}!</h2>
    <p style="font-size: 16px; color: #4a5568;">
        <strong>Recuerda que tienes una subasta programada.</strong>
    </p>
    <div style="background: #edf2f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #2b6cb0;">
            <b>ID de Subasta:</b> {{ $subasta->id }}
        </p>
        @if(isset($fechaInicio))
        <p style="margin: 0; color: #2b6cb0;">
            <b>Fecha de inicio:</b> {{ $fechaInicio }}
        </p>
        @endif
    </div>
    <p style="font-size: 15px; color: #718096;">
        La subasta comenzará en menos de una hora. ¡Prepárate!
    </p>
</div>
@endcomponent