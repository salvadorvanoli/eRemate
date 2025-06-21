# ERemate

## Pasos para inicializar el proyecto

### Inicialización de Back-End (consola)

Desde la consola de Laragon (son necesarias tres pestañas):
- Ingresar a la carpeta del back-end "eRemate".
- En diferentes pestañas, ejecutar los siguientes comandos:
    - "php artisan migrate:fresh && php artisan serve" (reinicia la base de datos) o "php artisan migrate:fresh --seed && php artisan serve" (si quieres cargar datos iniciales de prueba).
    - "start-websocket.bat"(inicializa el websocket).
    - "php artisan queue:work" (inicializa el sistema de colas).
    - "php artisan schedule:work" (inicializa los tareas periódicas).

### Inicialización de Front-End (consola)

Desde la consola:
- Ingresar a la carpeta del front-end "eRemateWeb".
- Ejecutar el siguiente comando:
    - "ng serve" (inicializa el servidor de desarrollo de Angular).