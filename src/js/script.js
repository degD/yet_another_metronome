
// Constants about the metronome
const SECONDS_IN_MINUTE   = 60
const WINDOW_SECONDS      = 0.1
const MAX_NUM_OF_BEATS    = 20
const MAX_BPM             = 600
const DEACTIVE_DARK       = "#252A34"
const DEACTIVE_LIGHT      = "#EAEAEA"
const ACTIVE_DARK         = "#0e72a0ff"
const ACTIVE_LIGHT        = "#08D9D6"

// Initialize Audio Context
const audioContext  = new window.AudioContext();
let audioSource = null;
let audioBufferTick = null;
let audioBufferTock = null;

// Preload audio for low-latency access
fetch('/sounds/tick.mp3')
  .then(response => response.arrayBuffer())
  .then(data => audioContext.decodeAudioData(data))
  .then(buffer => audioBufferTick = buffer);
fetch('/sounds/tock.mp3')
  .then(response => response.arrayBuffer())
  .then(data => audioContext.decodeAudioData(data))
  .then(buffer => audioBufferTock = buffer);

// Controlling whether the metronome is playing or not
let isPlaying = false;

/**
 * Schedule and play the beat for a duration
 * @param {number} startTime Start time of the beat in seconds since the Audio Context
 * @param {number} duration Duration of the beat in seconds 
 */
function playScheduledBeat(startTime, duration, audioBuffer) {
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
  let currentAudioBuffer = null;
  
  function scheduler() {

    if (!isPlaying) 
      return;

    // Schedule beats for next WINDOW_SECONDS window
    while (nextBeatTime < audioContext.currentTime + WINDOW_SECONDS) {
      currentAudioBuffer = currentBeat == 0 ? audioBufferTick : audioBufferTock;
      playScheduledBeat(nextBeatTime, beatInterval / 2, currentAudioBuffer);
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
    if (i == currentBeat) {
      beatBox.classList.add("active-background");
      beatBox.classList.remove("deactive-background");
    }
    else {
      beatBox.classList.add("deactive-background");
      beatBox.classList.remove("active-background");    
    }
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

/**
 * Toggle metronome play button visuality between pressed (playing) and stopped.
 */
function toggleButtonVisual() {
  const metronomeButton = document.getElementById("start-metronome-button");
  const playSvgIcon = document.getElementById("play-svg");
  const pauseSvgIcon = document.getElementById("pause-svg");
  if (isPlaying) {
    metronomeButton.classList.add("deactive-background");
    metronomeButton.classList.remove("active-background");    
    playSvgIcon["style"]["display"] = "none";
    pauseSvgIcon["style"]["display"] = "block";
    pauseSvgIcon.classList.add("active-fill");
    pauseSvgIcon.classList.remove("deactive-fill");
  }
  else {
    metronomeButton.classList.add("active-background");
    metronomeButton.classList.remove("deactive-background");
    pauseSvgIcon["style"]["display"] = "none";
    playSvgIcon["style"]["display"] = "block";
    playSvgIcon.classList.add("deactive-fill");
    playSvgIcon.classList.remove("active-fill");     
  }
}

/**
 * Returns true if a given variable is a positive integer
 * @param {number} n Number to be tested
 * @returns true if positive integer
 */
function isPositiveInteger(n) {
  return Number.isInteger(n) && n > 0;
}

/**
 * Set CSS color variables by Javascript
 * @param {string} activeColor Color string for active color
 * @param {string} deactiveColor Color string for deactive color
 */
function setCssColors(activeColor, deactiveColor) {
  const root = document.querySelector(':root');
  root.style.setProperty('--active-color', activeColor);
  root.style.setProperty('--deactive-color', deactiveColor);
}

// Change number of beat boxes displayed when input value changed
document.getElementById("number-of-beats").addEventListener("input", evt => {
  let newNumberOfBeats = Number(evt.target.value);
  newNumberOfBeats = isPositiveInteger(newNumberOfBeats) ? newNumberOfBeats : 1;
  newNumberOfBeats = Math.min(MAX_NUM_OF_BEATS, newNumberOfBeats);
  updateVisualBeatNumber(newNumberOfBeats);
});

// Toggle playing metronome when button is pressed
// Disable fields when metronome is playing
document.getElementById("start-metronome-button").addEventListener("click", evt => {
  const numberOfBeatsInput = document.getElementById("number-of-beats");
  const beatsPerMinuteInput = document.getElementById("beats-per-minute");
  let numberOfBeats = Number(numberOfBeatsInput.value);
  let beatsPerMinute = Number(beatsPerMinuteInput.value);
  numberOfBeats = isPositiveInteger(numberOfBeats) ? numberOfBeats : 1;
  beatsPerMinute = isPositiveInteger(beatsPerMinute) ? beatsPerMinute : 1;
  numberOfBeats = Math.min(MAX_NUM_OF_BEATS, numberOfBeats);
  beatsPerMinute = Math.min(MAX_BPM, beatsPerMinute);

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

// Get saved theme from localStorage (default: light)
// Auto-check if dark mode
document.addEventListener("DOMContentLoaded", () => {
  const themeSwitch = document.getElementById("theme-switch-input");
  const html = document.documentElement;
  const savedTheme = localStorage.getItem("theme") || "light";
  html.setAttribute("data-theme", savedTheme);
  themeSwitch.checked = savedTheme === "dark";
  if (savedTheme === "dark")
    setCssColors(ACTIVE_DARK, DEACTIVE_DARK);
  else
    setCssColors(ACTIVE_LIGHT, DEACTIVE_LIGHT);
  
  // Update theme and save preference on switch
  themeSwitch.addEventListener("change", (event) => {
    const newTheme = event.target.checked ? "dark" : "light";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark")
      setCssColors(ACTIVE_DARK, DEACTIVE_DARK);
    else
      setCssColors(ACTIVE_LIGHT, DEACTIVE_LIGHT);
  });
});

// Set initial input values
document.getElementById("number-of-beats").value = 4;
document.getElementById("beats-per-minute").value = 60;

// Set initial button icon
document.getElementById("play-svg")["style"]["display"] = "block";
document.getElementById("play-svg").classList.add("deactive-fill");
