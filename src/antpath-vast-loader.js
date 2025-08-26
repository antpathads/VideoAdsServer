/*!
 * AntPath Video SDK
 * Compatible with VAST 2.0 (parcialmente), próximamente 3.0
 * https://sdk.antpathads.com
 */
const AntPathAds = (function () {
  function track(url) {
    if (!url) return;
    const img = new Image();
    img.src = url;
  }

  function loadVastAd({
    zoneId,
    playerId,
    onAdStart,
    onAdComplete,
    onError,
    test = false,
  }) {
    const player = document.getElementById(playerId);
    if (!player) {
      onError?.(new Error("Player not found"));
      return;
    }

    // const vastUrl = test
    //   ? "https://sdk.antpathads.com/adserve/;ID=TEST_ZONE_ID;type=vast"
    //   : `https://sdk.antpathads.com/adserve/;ID=${zoneId};type=vast`;

    const vastUrl = "https://servedbyadbutler.com/vast.spark?setID=64469&ID=188743";

    fetch(vastUrl)
      .then((res) => res.text())
      .then((xmlText) => {
        // console.log(xmlText);
        const parser = new DOMParser();
        const vastXml = parser.parseFromString(xmlText, "text/xml");

        const mediaFile = vastXml.querySelector("MediaFile");
        const impression = vastXml
          .querySelector("Impression")
          ?.textContent?.trim();
        const complete = vastXml
          .querySelector("Tracking[event='complete']")
          ?.textContent?.trim();
        const errorTrack = vastXml.querySelector("Error")?.textContent?.trim();

        const mediaUrl = mediaFile?.textContent?.trim();

        console.log(impression);

        if (!mediaUrl) throw new Error("No media file found in VAST");

        player.src = mediaUrl;

        player.onplay = () => {
          if (impression) track(impression);
          onAdStart?.();
        };

        player.onended = () => {
          if (complete) track(complete);
          onAdComplete?.();
        };

        player.onerror = () => {
          if (errorTrack) track(errorTrack);
          onError?.(new Error("Error al reproducir el anuncio"));
        };

        player.load();
        // player.play().catch((err) => onError?.(err));
      })
      .catch((err) => {
        onError?.(err);
      });
  }

  return {
    loadVastAd,
  };
})();
