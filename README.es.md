# Implementación de VMAP con Video.js y el SDK de Google IMA

Este documento describe cómo implementar una solución VMAP con Video.js y el SDK de Google IMA.

## [DEMO](https://adserver.antpathads.com/videotest/index.html)

## Español

### 1. Incluir las librerías necesarias

Primero, necesitas incluir las librerías necesarias en tu archivo HTML. Esto incluye Video.js y el SDK de Google IMA.

```html
<link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />
<script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
<script src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
```

### 2. Agregar el elemento de video

Luego, necesitas agregar el elemento de video a tu archivo HTML.

```html
<video id="my-video" class="video-js" controls preload="auto" width="640" height="360" data-setup='{}'>
</video>
```

### 3. Inicializar el reproductor y el SDK de IMA

Finalmente, necesitas inicializar el reproductor de Video.js y el SDK de Google IMA. También necesitarás definir tu programación de pausas publicitarias y manejar los eventos de anuncios.

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const player = videojs('my-video', {
    fluid: true,
    responsive: true
  });

  // Establecer la fuente del video
  player.src({
    src: '/video.mp4',
    type: 'video/mp4'
  });

  // URLs de etiquetas de anuncios VAST - Zonas de AntPath
  const preRollTag = 'https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=1';
  const midRollTag = 'https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=2';
  const postRollTag = 'https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=3';
  
  // Definir la programación de pausas publicitarias
  function initializeAdBreaks() {
    adBreaks = [
      { type: 'preroll', time: 0, url: preRollTag, played: false },
      { type: 'midroll', time: 50, url: midRollTag, played: false }, // 50% del video
      { type: 'postroll', time: 'end', url: postRollTag, played: false }
    ];
  }
  
  // Configuración simple de IMA solo con pre-roll por ahora
  const imaOptions = {
    id: 'my-video',
    adTagUrl: preRollTag,
    adsWillAutoplay: true,
    debug: true
  };

  // Inicializar Google IMA directamente
  let adsManager;
  let adsLoader;
  let adDisplayContainer;
  let intervalTimer;
  let playButton;
  let adCountdownInterval;
  let adBreaks = [];
  let currentAdBreak = 0;
  let contentHasStarted = false;

  function createAdDisplayContainer() {
    const videoElement = document.getElementById('my-video');
    const playerElement = videoElement.closest('.video-js');
    
    // Crear contenedor de anuncios dentro del reproductor de video
    const adContainer = document.createElement('div');
    adContainer.id = 'ad-container';
    adContainer.style.position = 'absolute';
    adContainer.style.top = '0';
    adContainer.style.left = '0';
    adContainer.style.width = '100%';
    adContainer.style.height = '100%';
    adContainer.style.zIndex = '1000';
    adContainer.style.display = 'none';
    adContainer.style.backgroundColor = '#000';
    
    // Crear superposición de cuenta regresiva de anuncios
    const adCountdown = document.createElement('div');
    adCountdown.id = 'ad-countdown';
    adCountdown.style.position = 'absolute';
    adCountdown.style.top = '10px';
    adCountdown.style.right = '10px';
    adCountdown.style.color = '#fff';
    adCountdown.style.fontSize = '14px';
    adCountdown.style.fontFamily = 'Arial, sans-serif';
    adCountdown.style.backgroundColor = 'rgba(0,0,0,0.7)';
    adCountdown.style.padding = '5px 10px';
    adCountdown.style.borderRadius = '4px';
    adCountdown.style.zIndex = '1001';
    adCountdown.style.display = 'none';
    
    // Agregar contenedores al reproductor
    playerElement.appendChild(adContainer);
    playerElement.appendChild(adCountdown);
    
    adDisplayContainer = new google.ima.AdDisplayContainer(
      adContainer,
      videoElement
    );
  }

  function playAds() {
    try {
      // Mostrar el contenedor de anuncios inmediatamente
      const adContainer = document.getElementById('ad-container');
      if (adContainer) {
        adContainer.style.display = 'flex';
      }
      
      adDisplayContainer.initialize();
      adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
      adsManager.start();
      console.log('Reproducción de anuncios iniciada');
    } catch (adError) {
      console.error('Error al inicializar los anuncios:', adError);
      // Ocultar el contenedor de anuncios en caso de error
      const adContainer = document.getElementById('ad-container');
      if (adContainer) {
        adContainer.style.display = 'none';
      }
      player.play();
    }
  }

  function onAdsManagerLoaded(adsManagerLoadedEvent) {
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
    
    adsManager = adsManagerLoadedEvent.getAdsManager(
      player.el(),
      adsRenderingSettings
    );

    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, onContentPauseRequested);
    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onContentResumeRequested);
    adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, onAdEvent);
    adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdEvent);

    playAds();
  }

  function startAdCountdown(duration) {
    const adCountdown = document.getElementById('ad-countdown');
    let timeRemaining = Math.ceil(duration);
    
    if (adCountdown) {
      adCountdown.style.display = 'block';
      adCountdown.textContent = `Anuncio • ${timeRemaining}s`;
      
      adCountdownInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining >= 0) {
          adCountdown.textContent = `Anuncio • ${timeRemaining}s`;
        } else {
          clearInterval(adCountdownInterval);
          adCountdown.style.display = 'none';
        }
      }, 1000);
    }
  }

  function stopAdCountdown() {
    if (adCountdownInterval) {
      clearInterval(adCountdownInterval);
    }
    const adCountdown = document.getElementById('ad-countdown');
    if (adCountdown) {
      adCountdown.style.display = 'none';
    }
  }

  function onAdEvent(adEvent) {
    const ad = adEvent.getAd();
    const adContainer = document.getElementById('ad-container');
    
    switch (adEvent.type) {
      case google.ima.AdEvent.Type.LOADED:
        console.log('Anuncio cargado');
        if (!ad.isLinear()) {
          player.play();
        }
        break;
      case google.ima.AdEvent.Type.STARTED:
        console.log('Anuncio iniciado');
        // Mostrar el contenedor de anuncios cuando comienza el anuncio
        if (adContainer) {
          adContainer.style.display = 'flex';
        }
        // Iniciar el temporizador de cuenta regresiva
        const adDuration = ad.getDuration();
        if (adDuration && adDuration > 0) {
          startAdCountdown(adDuration);
        }
        break;
      case google.ima.AdEvent.Type.COMPLETE:
        console.log('Anuncio completado');
        // Ocultar el contenedor de anuncios cuando se completa el anuncio
        if (adContainer) {
          adContainer.style.display = 'none';
        }
        stopAdCountdown();
        
        // Comprobar si se trata de un anuncio post-roll; si es así, no reanudar el contenido
        const isPostRoll = adBreaks.some(adBreak => 
          adBreak.type === 'postroll' && adBreak.played
        );
        
        if (isPostRoll && player.currentTime() >= player.duration() - 1) {
          console.log('Post-roll completado - manteniendo el video detenido');
          player.pause();
          // Opcionalmente, mostrar la pantalla de finalización
          player.trigger('ended');
        }
        break;
    }
  }

  function onAdError(adErrorEvent) {
    console.error('Error de anuncio:', adErrorEvent.getError());
    console.error('Detalles del error:', adErrorEvent.getError().getMessage());
    
    // Ocultar el contenedor de anuncios en caso de error
    const adContainer = document.getElementById('ad-container');
    if (adContainer) {
      adContainer.style.display = 'none';
    }
    
    // Detener la cuenta regresiva en caso de error
    stopAdCountdown();
    
    if (adsManager) {
      adsManager.destroy();
    }
    player.play();
  }

  function onContentPauseRequested() {
    player.pause();
    console.log('Contenido en pausa por anuncio');
  }

  function onContentResumeRequested() {
    console.log('Reanudando contenido después del anuncio');
    
    // No reanudar si se trata de un anuncio post-roll
    const isPostRoll = adBreaks.some(adBreak => 
      adBreak.type === 'postroll' && adBreak.played
    );
    
    if (isPostRoll && player.currentTime() >= player.duration() - 1) {
      console.log('Post-roll completado - no se reanuda el contenido');
      player.pause();
      return;
    }
    
    player.play();
  }

  function requestAds(adBreak) {
    console.log(`Solicitando anuncio ${adBreak.type} de:`, adBreak.url);
    
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = adBreak.url;
    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 360;
    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    console.log(`Realizando solicitud de anuncio ${adBreak.type}...`);
    adsLoader.requestAds(adsRequest);
  }

  function checkForAdBreaks() {
    if (!contentHasStarted || player.paused()) return;
    
    const currentTime = player.currentTime();
    const duration = player.duration();
    const progressPercent = (currentTime / duration) * 100;
    
    for (let i = 0; i < adBreaks.length; i++) {
      const adBreak = adBreaks[i];
      
      if (adBreak.played) continue;
      
      // Comprobar el tiempo del mid-roll (basado en porcentaje)
      if (adBreak.type === 'midroll' && progressPercent >= adBreak.time) {
        console.log(`Activando anuncio mid-roll al ${progressPercent.toFixed(1)}%`);
        adBreak.played = true;
        player.pause();
        requestAds(adBreak);
        break;
      }
    }
  }

  function checkForPostRoll() {
    const postRollAd = adBreaks.find(ad => ad.type === 'postroll' && !ad.played);
    if (postRollAd) {
      console.log('Activando anuncio post-roll');
      postRollAd.played = true;
      requestAds(postRollAd);
    }
  }

  // Inicializar cuando el reproductor esté listo
  player.ready(function() {
    initializeAdBreaks();
    createAdDisplayContainer();
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded);
    adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);

    // Solicitar anuncios pre-roll cuando el usuario haga clic en reproducir
    player.one('play', function(event) {
      const prerollAd = adBreaks.find(ad => ad.type === 'preroll' && !ad.played);
      if (prerollAd) {
        // Pausar inmediatamente el video para evitar que el contenido comience
        player.pause();
        player.currentTime(0); // Restablecer al principio
        
        prerollAd.played = true;
        requestAds(prerollAd);
        
        // Evitar que el evento de reproducción continúe
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    });

    // Monitorear el progreso del video para anuncios mid-roll
    player.on('timeupdate', checkForAdBreaks);

    // Manejar el final del video para post-roll
    player.on('ended', function() {
      checkForPostRoll();
    });

    // Rastrear cuándo comienza realmente el contenido
    player.on('playing', function() {
      if (!contentHasStarted) {
        contentHasStarted = true;
        console.log('La reproducción del contenido ha comenzado');
      }
    });
  });
});
```
