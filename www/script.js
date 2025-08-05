document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([20, -100], 5);
  let miUbicacion = null;
  let marcadorUsuario = null;
  let marcadorDestino = null;
  let controlRuta = null;
  let watchId = null;
  let alertaActivada = false;

  // Base del mapa
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  // ⚙️ Activar seguimiento GPS en tiempo real
  window.activarUbicacion = function () {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      alert("Seguimiento detenido");
      return;
    }

    watchId = navigator.geolocation.watchPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const nuevaUbicacion = L.latLng(lat, lng);

      if (!miUbicacion || nuevaUbicacion.distanceTo(miUbicacion) > 2) {
        miUbicacion = nuevaUbicacion;

        if (!map.getBounds().contains(miUbicacion)) {
          map.setView(miUbicacion, 15);
        }

        if (marcadorUsuario) marcadorUsuario.remove();
        marcadorUsuario = L.marker(miUbicacion).addTo(map).bindPopup("📍 Estás aquí").openPopup();

        if (controlRuta && marcadorDestino) {
          controlRuta.setWaypoints([miUbicacion, marcadorDestino.getLatLng()]);
        }

        // 📍 Verifica si estás cerca del destino (10 metros)
        if (marcadorDestino && !alertaActivada) {
          const distancia = miUbicacion.distanceTo(marcadorDestino.getLatLng());
          if (distancia < 10) {
            alertaActivada = true;
            vibrarYSonar();
          }
        }
      }
    }, err => {
      alert("Error obteniendo ubicación: " + err.message);
    }, {
      enableHighAccuracy: true,
      timeout: 3000,
      maximumAge: 1000
    });
  };

  // 📍 Marcar destino tocando el mapa
  map.on('click', e => {
    if (!miUbicacion) {
      alert("Primero activa la ubicación.");
      return;
    }

    const destino = e.latlng;
    alertaActivada = false;

    if (marcadorDestino) marcadorDestino.remove();
    marcadorDestino = L.marker(destino).addTo(map).bindPopup("🎯 Destino").openPopup();

    if (controlRuta) {
      controlRuta.setWaypoints([miUbicacion, destino]);
    } else {
      if (typeof L.Routing !== 'undefined' && L.Routing.control) {
        controlRuta = L.Routing.control({
          waypoints: [miUbicacion, destino],
          routeWhileDragging: false,
          fitSelectedRoutes: true,
          show: false,
          lineOptions: {
            styles: [{ color: 'red', opacity: 0.8, weight: 5 }]
          },
          createMarker: () => null
        }).addTo(map);
      } else {
        alert("L.Routing no está cargado correctamente.");
      }
    }
  });

  // 📳 Vibración y sonido al llegar cerca del destino
  function vibrarYSonar() {
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    const audio = new Audio("https://www.soundjay.com/button/beep-07.wav");
    audio.play().catch(() => {
      console.log("⚠️ Sonido bloqueado por el navegador");
    });

    alert("¡Has llegado a tu destino!");
  }
});
