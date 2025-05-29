// Test de WebSockets con Soketi
// Este archivo nos ayuda a probar la funcionalidad de WebSockets sin necesidad
// de toda la aplicación.

// Para usar esto, abra este archivo en un navegador y vea la consola.
// También puede abrir otra ventana del navegador con este mismo archivo
// para ver cómo los mensajes se distribuyen en tiempo real.

// Requisitos: 
// 1. El servidor Soketi debe estar corriendo (ejecutar start-websocket.bat)
// 2. Laravel debe estar corriendo para procesar los eventos

document.addEventListener('DOMContentLoaded', function() {
  // Referencias a elementos del DOM
  const statusElement = document.getElementById('connection-status');
  const messagesElement = document.getElementById('messages');
  const subastaIdInput = document.getElementById('subasta-id');
  const conectarButton = document.getElementById('conectar-button');
  const loteIdInput = document.getElementById('lote-id');
  const montoInput = document.getElementById('monto');
  const enviarPujaButton = document.getElementById('enviar-puja-button');

  // Variables globales
  let pusher = null;
  let channel = null;
  let userToken = "1|8WxgQjZ34S0zJP3zJSSmIKUcGLsCrqNTWxMObNCl0a109061"; // Reemplazar con el token de usuario real

  // Estado inicial
  updateStatus('Desconectado', false);

  // Eventos
  conectarButton.addEventListener('click', function() {
    const subastaId = subastaIdInput.value;
    if (!subastaId) {
      alert('Por favor, ingrese el ID de la subasta');
      return;
    }
    
    connectToWebsocket(subastaId);
  });

  enviarPujaButton.addEventListener('click', function() {
    const subastaId = subastaIdInput.value;
    const loteId = loteIdInput.value;
    const monto = montoInput.value;
    
    if (!subastaId || !loteId || !monto) {
      alert('Por favor, complete todos los campos');
      return;
    }
    
    sendPuja(subastaId, loteId, monto);
  });

  // Funciones
  function connectToWebsocket(subastaId) {
    try {
      // Si ya hay una conexión, la cerramos
      if (pusher) {
        pusher.disconnect();
      }
      
      updateStatus('Conectando...', false);
      
      // Configurar Pusher
      pusher = new Pusher('app-key', {
        wsHost: window.location.hostname,
        wsPort: 6001,
        forceTLS: false,
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        cluster: 'mt1'
      });
      
      // Suscribirse al canal
      channel = pusher.subscribe(`subasta.${subastaId}`);
      
      // Escuchar el evento de conexión
      pusher.connection.bind('connected', function() {
        updateStatus('Conectado', true);
        addMessage(`Conectado al canal subasta.${subastaId}`);
        console.log('DEBUG: Conexión establecida con Pusher');
      });
      
      // Escuchar errores
      pusher.connection.bind('error', function(err) {
        updateStatus(`Error: ${err.message}`, false);
        addMessage(`Error de conexión: ${err.message}`);
      });
      
      // Escuchar el evento de nueva puja
      channel.bind('nueva.puja', function(data) {
        addMessage(`Nueva puja recibida: Lote #${data.lote_id}, Monto: $${data.monto}`);
        console.log('Datos completos de la puja:', data);
      });

      // Escuchar también eventos con nombre completo (por si acaso)
      channel.bind('App\\Events\\NuevaPujaEvent', function(data) {
        addMessage(`Nueva puja recibida (nombre completo): Lote #${data.lote_id}, Monto: $${data.monto}`);
        console.log('Datos completos de la puja (nombre completo):', data);
      });
      
      // Escuchar cuando la suscripción al canal fue exitosa
      channel.bind('pusher:subscription_succeeded', function() {
        console.log('DEBUG: Suscripción al canal exitosa');
        addMessage('Suscripción al canal exitosa');
      });
      
      // En lugar de bind_all, usamos el objecto global pusher para escuchar todos los eventos
      pusher.bind_global(function(eventName, data) {
        console.log('DEBUG: Evento global recibido:', eventName, data);
      });

    } catch (error) {
      updateStatus(`Error: ${error.message}`, false);
      console.error('Error al conectar:', error);
    }
  }

  function sendPuja(subastaId, loteId, monto) {
    // Enviamos la puja al servidor API de Laravel
    fetch(`http://127.0.0.1:8000/api/auction/${subastaId}/bid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${userToken}`
        // Agregar cualquier token de autenticación necesario
      },
      body: JSON.stringify({
        lote_id: parseInt(loteId),
        monto: parseFloat(monto)
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        addMessage(`Puja enviada correctamente: ${data.message}`);
      } else {
        addMessage(`Error al enviar puja: ${data.message}`);
      }
    })
    .catch(error => {
      addMessage(`Error de red al enviar puja: ${error.message}`);
    });
  }

  function updateStatus(text, connected) {
    statusElement.textContent = text;
    statusElement.className = connected ? 'connected' : 'disconnected';
  }

  function addMessage(message) {
    const item = document.createElement('li');
    item.textContent = message;
    messagesElement.appendChild(item);
  }
});
