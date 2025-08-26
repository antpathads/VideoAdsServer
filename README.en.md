# VMAP Implementation with Video.js and Google IMA SDK

This document describes how to implement a VMAP solution with Video.js and the Google IMA SDK.

## [DEMO](https://adserver.antpathads.com/videotest/index.html)

## English

### 1. Include the necessary libraries

First, you need to include the necessary libraries in your HTML file. This includes Video.js and the Google IMA SDK.

```html
<link href="https://vjs.zencdn.net/8.10.0/video-js.css" rel="stylesheet" />
<script src="https://vjs.zencdn.net/8.10.0/video.min.js"></script>
<script src="https://imasdk.googleapis.com/js/sdkloader/ima3.js"></script>
```

### 2. Add the video element

Next, you need to add the video element to your HTML file.

```html
<video id="my-video" class="video-js" controls preload="auto" width="640" height="360" data-setup='{}'>
</video>
```

### 3. Initialize the player and the IMA SDK

Finally, you need to initialize the Video.js player and the Google IMA SDK. You will also need to define your ad break schedule and handle the ad events.

```javascript
document.addEventListener('DOMContentLoaded', function() {
  const player = videojs('my-video', {
    fluid: true,
    responsive: true
  });

  // Set video source
  player.src({
    src: '/video.mp4',
    type: 'video/mp4'
  });

  // VAST ad tag URLs - AntPath zones
  const preRollTag = 'https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=1';
  const midRollTag = 'https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=2';
  const postRollTag = 'https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=3';
  
  // Define ad break schedule
  function initializeAdBreaks() {
    adBreaks = [
      { type: 'preroll', time: 0, url: preRollTag, played: false },
      { type: 'midroll', time: 50, url: midRollTag, played: false }, // 50% of video
      { type: 'postroll', time: 'end', url: postRollTag, played: false }
    ];
  }
  
  // Simple IMA configuration with just pre-roll for now
  const imaOptions = {
    id: 'my-video',
    adTagUrl: preRollTag,
    adsWillAutoplay: true,
    debug: true
  };

  // Initialize Google IMA directly
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
    
    // Create ad container inside the video player
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
    
    // Create ad countdown overlay
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
    
    // Add containers to player
    playerElement.appendChild(adContainer);
    playerElement.appendChild(adCountdown);
    
    adDisplayContainer = new google.ima.AdDisplayContainer(
      adContainer,
      videoElement
    );
  }

  function playAds() {
    try {
      // Show ad container immediately
      const adContainer = document.getElementById('ad-container');
      if (adContainer) {
        adContainer.style.display = 'flex';
      }
      
      adDisplayContainer.initialize();
      adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
      adsManager.start();
      console.log('Ad playback initiated');
    } catch (adError) {
      console.error('Error initializing ads:', adError);
      // Hide ad container on error
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
      adCountdown.textContent = `Ad • ${timeRemaining}s`;
      
      adCountdownInterval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining >= 0) {
          adCountdown.textContent = `Ad • ${timeRemaining}s`;
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
        console.log('Ad loaded');
        if (!ad.isLinear()) {
          player.play();
        }
        break;
      case google.ima.AdEvent.Type.STARTED:
        console.log('Ad started');
        // Show ad container when ad starts
        if (adContainer) {
          adContainer.style.display = 'flex';
        }
        // Start countdown timer
        const adDuration = ad.getDuration();
        if (adDuration && adDuration > 0) {
          startAdCountdown(adDuration);
        }
        break;
      case google.ima.AdEvent.Type.COMPLETE:
        console.log('Ad completed');
        // Hide ad container when ad completes
        if (adContainer) {
          adContainer.style.display = 'none';
        }
        stopAdCountdown();
        
        // Check if this was a postroll ad - if so, don't resume content
        const isPostRoll = adBreaks.some(adBreak => 
          adBreak.type === 'postroll' && adBreak.played
        );
        
        if (isPostRoll && player.currentTime() >= player.duration() - 1) {
          console.log('Postroll completed - keeping video stopped');
          player.pause();
          // Optionally show ended screen
          player.trigger('ended');
        }
        break;
    }
  }

  function onAdError(adErrorEvent) {
    console.error('Ad error:', adErrorEvent.getError());
    console.error('Error details:', adErrorEvent.getError().getMessage());
    
    // Hide ad container on error
    const adContainer = document.getElementById('ad-container');
    if (adContainer) {
      adContainer.style.display = 'none';
    }
    
    // Stop countdown on error
    stopAdCountdown();
    
    if (adsManager) {
      adsManager.destroy();
    }
    player.play();
  }

  function onContentPauseRequested() {
    player.pause();
    console.log('Content paused for ad');
  }

  function onContentResumeRequested() {
    console.log('Content resuming after ad');
    
    // Don't resume if this was a postroll ad
    const isPostRoll = adBreaks.some(adBreak => 
      adBreak.type === 'postroll' && adBreak.played
    );
    
    if (isPostRoll && player.currentTime() >= player.duration() - 1) {
      console.log('Postroll completed - not resuming content');
      player.pause();
      return;
    }
    
    player.play();
  }

  function requestAds(adBreak) {
    console.log(`Requesting ${adBreak.type} ad from:`, adBreak.url);
    
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = adBreak.url;
    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 360;
    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    console.log(`Making ${adBreak.type} ad request...`);
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
      
      // Check midroll timing (percentage based)
      if (adBreak.type === 'midroll' && progressPercent >= adBreak.time) {
        console.log(`Triggering midroll ad at ${progressPercent.toFixed(1)}%`);
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
      console.log('Triggering postroll ad');
      postRollAd.played = true;
      requestAds(postRollAd);
    }
  }

  // Initialize when player is ready
  player.ready(function() {
    initializeAdBreaks();
    createAdDisplayContainer();
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);
    adsLoader.addEventListener(google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, onAdsManagerLoaded);
    adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);

    // Request preroll ads when user clicks play
    player.one('play', function(event) {
      const prerollAd = adBreaks.find(ad => ad.type === 'preroll' && !ad.played);
      if (prerollAd) {
        // Immediately pause the video to prevent content from starting
        player.pause();
        player.currentTime(0); // Reset to beginning
        
        prerollAd.played = true;
        requestAds(prerollAd);
        
        // Prevent the play event from continuing
        event.preventDefault();
        event.stopImmediatePropagation();
        return false;
      }
    });

    // Monitor video progress for midroll ads
    player.on('timeupdate', checkForAdBreaks);

    // Handle video end for postroll
    player.on('ended', function() {
      checkForPostRoll();
    });

    // Track when content actually starts
    player.on('playing', function() {
      if (!contentHasStarted) {
        contentHasStarted = true;
        console.log('Content playback started');
      }
    });
  });
});
```
