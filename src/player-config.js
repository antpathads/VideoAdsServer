// 1. Get a reference to the video player
const player = videojs("my-video");

// 2. Define the IMA plugin options
const imaOptions = {
  id: "my-video",
  // This is where you paste your Adbutler VAST Tag URL
  adTagUrl: "https://servedbyadbutler.com/vast.spark?setID=64469&ID=188743",
};

// 3. Initialize the IMA plugin on the player
player.ima(imaOptions);

// 4. (Optional) Initialize the ad container on user interaction
// This is required by modern browsers to prevent auto-playing ads with sound.
player.on("play", function () {
  player.ima.initializeAdDisplayContainer();
});
