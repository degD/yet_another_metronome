
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
fetch('assets/sounds/tone.mp3')
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
  const beatBoxes = document.querySelectorAll(".beatBox");
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
  const beatBoxContainer = document.getElementById("beatBoxContainer");
  beatBoxContainer.innerHTML = "";
  for (let i = 0; i < numberOfBeats; i++) 
    beatBoxContainer.innerHTML += '<div class="beatBox"></div>';
}

// Change number of beat boxes displayed when input value changed
document.getElementById("numberOfBeats").addEventListener("input", evt => {
  const newNumberOfBeats = +(evt.target.value);
  updateVisualBeatNumber(newNumberOfBeats);
});

// Toggle playing metronome when button is pressed
// Disable fields when metronome is playing
document.getElementById("startMetronomeButton").addEventListener("click", evt => {
  const numberOfBeatsInput = document.getElementById("numberOfBeats");
  const numberOfBeats = numberOfBeatsInput.value;
  const beatsPerMinuteInput = document.getElementById("beatsPerMinute");
  const beatsPerMinute = beatsPerMinuteInput.value;
  if (isPlaying) {
    stopPlayingBeats();
    numberOfBeatsInput.disabled = false;
    beatsPerMinuteInput.disabled = false;
  }
  else {
    startPlayingBeats(numberOfBeats, beatsPerMinute);
    numberOfBeatsInput.disabled = true;
    beatsPerMinuteInput.disabled = true;
  }
});

// Set initial input values
document.getElementById("numberOfBeats").value = 4;
document.getElementById("beatsPerMinute").value = 60;
