var Ads = function () {
  this.player = videojs("content_video");

  this.player.ready(() => {
    // this.ads();
    console.log("player ready");
  });

  // this.player.on("ready", () => {
  //   this.ads();
  // });

  // Remove controls from the player on iPad to stop native controls from stealing
  // our click
  var contentPlayer = document.getElementById("content_video_html5_api");
  if (
    (navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/Android/i)) &&
    contentPlayer.hasAttribute("controls")
  ) {
    contentPlayer.removeAttribute("controls");
  }

  // Start ads when the video player is clicked, but only the first time it's
  // clicked.
  this.startEvent = "click";
  if (
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/Android/i)
  ) {
    this.startEvent = "touchend";
  }
  this.wrapperDiv = document.getElementById("content_video");
  this.boundInitFromStart = this.initFromStart.bind(this);
  this.wrapperDiv.addEventListener(
    this.startEvent,
    this.initFromStart.bind(this),
  );

  this.preRollTagUrl =
    "https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=1";
  this.midRollTagUrl =
    "https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=2";
  this.postRollTagUrl =
    "https://adserver.antpathads.com/www/delivery/fc.php?script=apVideo:vast2&zoneid=3";

  // Request video ads.
  this.vmapXML =
    '<vmap:VMAP xmlns:vmap="http://www.iab.net/vmap/1.0" version="1.0">' +
    '<vmap:AdBreak timeOffset="start" breakType="linear" breakId="preroll">' +
    '<vmap:AdSource id="preroll-ad" allowMultipleAds="false" followRedirects="true">' +
    '<vmap:AdTagURI templateType="vast2">' +
    "<![CDATA[" +
    this.preRollTagUrl +
    "]]>" +
    "</vmap:AdTagURI>" +
    "</vmap:AdSource>" +
    "</vmap:AdBreak>" +
    '<vmap:AdBreak timeOffset="50%" breakType="linear" breakId="midroll">' +
    '<vmap:AdSource id="midroll-ad" allowMultipleAds="false" followRedirects="true">' +
    '<vmap:AdTagURI templateType="vast2">' +
    "<![CDATA[" +
    this.midRollTagUrl +
    "]]>" +
    "</vmap:AdTagURI>" +
    "</vmap:AdSource>" +
    "</vmap:AdBreak>" +
    '<vmap:AdBreak timeOffset="end" breakType="linear" breakId="postroll">' +
    '<vmap:AdSource id="postroll-ad" allowMultipleAds="false" followRedirects="true">' +
    '<vmap:AdTagURI templateType="vast2">' +
    "<![CDATA[" +
    this.postRollTagUrl +
    "]]>" +
    "</vmap:AdTagURI>" +
    "</vmap:AdSource>" +
    "</vmap:AdBreak>" +
    "</vmap:VMAP>";

  this.options = {
    id: "content_video",
    adTagUrl: "data:text/xml;charset=utf-8;base64," + btoa(this.vmapXML),
    adsManagerLoadedCallback: this.adsManagerLoadedCallback.bind(this),
  };

  this.linearAdPlaying = false;
  this.initialized = false;

  this.player.ima(this.options);
};

Ads.prototype.initFromStart = function () {
  console.log("init from start");
  if (!this.initialized) {
    this.init();
    this.wrapperDiv.removeEventListener(
      this.startEvent,
      this.boundInitFromStart,
    );
  }
};

Ads.prototype.init = function () {
  console.log("init");
  this.initialized = true;
  this.player.ima.initializeAdDisplayContainer();
};

Ads.prototype.adsManagerLoadedCallback = function () {
  console.log("ads manager loaded callback");
  var events = [
    google.ima.AdEvent.Type.ALL_ADS_COMPLETED,
    google.ima.AdEvent.Type.CLICK,
    google.ima.AdEvent.Type.COMPLETE,
    google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
    google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED,
    google.ima.AdEvent.Type.FIRST_QUARTILE,
    google.ima.AdEvent.Type.LOADED,
    google.ima.AdEvent.Type.MIDPOINT,
    google.ima.AdEvent.Type.PAUSED,
    google.ima.AdEvent.Type.STARTED,
    google.ima.AdEvent.Type.THIRD_QUARTILE,
  ];

  for (var index = 0; index < events.length; index++) {
    this.player.ima.addEventListener(events[index], this.onAdEvent.bind(this));
  }
};

Ads.prototype.onAdEvent = function (event) {
  console.log(event.type);
  if (event.type == google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED) {
    this.linearAdPlaying = true;
  } else if (event.type == google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED) {
    this.linearAdPlaying = false;
  }
};
