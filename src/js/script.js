
// Constants about the metronome
const BEAT_ACTIVE_COLOR   = "#A2D729"
const BEAT_DEACTIVE_COLOR = "#1B5E20"
const SECONDS_IN_MINUTE   = 60
const WINDOW_SECONDS      = 0.1

// Initialize Audio Context
const audioContext  = new window.AudioContext();
let audioSource = null;
let audioBuffer = null;

// Preload audio for low-latency access
fetch('/sounds/tone.mp3')
  .then(response => response.arrayBuffer())
  .then(data => audioContext.decodeAudioData(data))
  .then(buffer => audioBuffer = buffer);

// Controlling whether the metronome is playing or not
let isPlaying = false;

/**
 * Schedule and play the beat for a duration
 * @param {number} startTime Start time of the beat in seconds since the Audio Context
 * @param {number} duration Duration of the beat in seconds 
 */
function playScheduledBeat(startTime, duration) {
  audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  audioSource.connect(audioContext.destination);
  audioSource.start(startTime, 0, duration);
}

/**
 * Start playing the metronome
 * @param {number} numberOfBeats Number of beats to be played and displayed
 * @param {number} beatsPerMinute Number of beats to be played in a minute, bpm
 */
function startPlayingBeats(numberOfBeats, beatsPerMinute) {
  if (audioContext.state === 'suspended') {
    audioContext.resume(); // Required for autoplay policies
  }
  
  isPlaying = true;

  const beatInterval = SECONDS_IN_MINUTE / beatsPerMinute;
  let nextBeatTime = audioContext.currentTime;
  let nextVisualBeatTime = audioContext.currentTime;
  let currentBeat = 0;
  
  function scheduler() {

    if (!isPlaying) 
      return;

    // Schedule beats for next WINDOW_SECONDS window
    while (nextBeatTime < audioContext.currentTime + WINDOW_SECONDS) {
      playScheduledBeat(nextBeatTime, beatInterval / 2);
      if (nextVisualBeatTime <= audioContext.currentTime) {
        updateVisualActiveBeat(currentBeat);
        nextVisualBeatTime = nextBeatTime;
      }
      nextBeatTime += beatInterval;
      currentBeat = (currentBeat + 1) % numberOfBeats;
    }
    requestAnimationFrame(scheduler);
  }
  
  scheduler();
}

/**
 * Stop the metronome if playing
 */
function stopPlayingBeats() {
  if (isPlaying) {
    isPlaying = false;
    audioSource.disconnect(); // Stop in the middle of beat
  }
}

/**
 * Highlight the beat at the given index
 * @param {number} currentBeat Index of the active beat's box. Starting from zero
 */
function updateVisualActiveBeat(currentBeat) {
  const beatBoxes = document.querySelectorAll(".beat-box");
  beatBoxes.forEach((beatBox, i) => {
    if (i == currentBeat)
      beatBox["style"]["background"] = BEAT_ACTIVE_COLOR;
    else
      beatBox["style"]["background"] = BEAT_DEACTIVE_COLOR;
  })
}

/**
 * Update the number of beat boxes displayed on screen
 * @param {number} numberOfBeats Number of beats that will be displayed
 */
function updateVisualBeatNumber(numberOfBeats) {
  const beatBoxContainer = document.getElementById("beat-box-container");
  beatBoxContainer.innerHTML = "";
  for (let i = 0; i < numberOfBeats; i++) 
    beatBoxContainer.innerHTML += '<div class="beat-box"></div>';
}

function toggleButtonVisual() {
  const metronomeButton = document.getElementById("start-metronome-button");
  const playSvgIcon = document.getElementById("play-svg");
  const pauseSvgIcon = document.getElementById("pause-svg");
  if (isPlaying) {
    metronomeButton["style"]["background"] = BEAT_DEACTIVE_COLOR;
    playSvgIcon["style"]["display"] = "none";
    pauseSvgIcon["style"]["display"] = "block";
    pauseSvgIcon["style"]["fill"] = BEAT_ACTIVE_COLOR;
  }
  else {
    metronomeButton["style"]["background"] = BEAT_ACTIVE_COLOR;
    pauseSvgIcon["style"]["display"] = "none";
    playSvgIcon["style"]["display"] = "block";
    playSvgIcon["style"]["fill"] = BEAT_DEACTIVE_COLOR;
  }
}

// Change number of beat boxes displayed when input value changed
document.getElementById("number-of-beats").addEventListener("input", evt => {
  const newNumberOfBeats = +(evt.target.value);
  updateVisualBeatNumber(newNumberOfBeats);
});

// Toggle playing metronome when button is pressed
// Disable fields when metronome is playing
document.getElementById("start-metronome-button").addEventListener("click", evt => {
  const numberOfBeatsInput = document.getElementById("number-of-beats");
  const numberOfBeats = numberOfBeatsInput.value;
  const beatsPerMinuteInput = document.getElementById("beats-per-minute");
  const beatsPerMinute = beatsPerMinuteInput.value;
  if (isPlaying) {
    stopPlayingBeats();
    numberOfBeatsInput.disabled = false;
    beatsPerMinuteInput.disabled = false;
    toggleButtonVisual();
  }
  else {
    startPlayingBeats(numberOfBeats, beatsPerMinute);
    numberOfBeatsInput.disabled = true;
    beatsPerMinuteInput.disabled = true;
    toggleButtonVisual();
  }
});

// Set initial input values
document.getElementById("number-of-beats").value = 4;
document.getElementById("beats-per-minute").value = 60;

// Set initial button icon
document.getElementById("play-svg")["style"]["display"] = "block";
document.getElementById("play-svg")["style"]["fill"] = BEAT_ACTIVE_COLOR;
