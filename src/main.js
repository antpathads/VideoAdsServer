import "./antpath-vast-loader.js";

console.log("caca");

AntPathAds.loadVastAd({
  zoneId: "123456", // Reemplazar por Zone ID real
  playerId: "player",
  onAdStart: () => console.log("Anuncio iniciado"),
  onAdComplete: () => console.log("Anuncio finalizado"),
  onError: (err) => console.error("Error:", err),
  test: true,
});
