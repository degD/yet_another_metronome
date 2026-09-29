import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Status bar control functions
const setStatusBarStyleDark = async () => {
  if (Capacitor.isNativePlatform())
    await StatusBar.setStyle({ style: Style.Dark });
};
const setStatusBarStyleLight = async () => {
  if (Capacitor.isNativePlatform())
    await StatusBar.setStyle({ style: Style.Light });
};

// Constants about the metronome
const SECONDS_IN_MINUTE = 60;
const WINDOW_SECONDS = 0.1;
const MAX_NUM_OF_BEATS = 20;
const MAX_BPM = 600;
const DEACTIVE_DARK = "#252A34";
const DEACTIVE_LIGHT = "#EAEAEA";
const ACTIVE_DARK = "#0e72a0ff";
const ACTIVE_LIGHT = "#08D9D6";

// Initialize Audio Context
const audioContext = new window.AudioContext();
let audioSource: AudioBufferSourceNode | null = null;
let audioBufferTick: AudioBuffer | null = null;
let audioBufferTock: AudioBuffer | null = null;

// Input components
function getRequiredElement<T extends Element>(id: string): T {
  const element = document.querySelector<T>(`#${id}`);
  if (element === null)
    throw new Error(`Missing required element: #${id}`);
  return element;
}

const numberOfBeatsInput = getRequiredElement<HTMLInputElement>("number-of-beats");
const beatsPerMinuteInput = getRequiredElement<HTMLInputElement>("beats-per-minute");
const beatBoxContainer = getRequiredElement<HTMLDivElement>("beat-box-container");
const metronomeButton = getRequiredElement<HTMLDivElement>("start-metronome-button");
const playSvgIcon = getRequiredElement<SVGSVGElement>("play-svg");
const pauseSvgIcon = getRequiredElement<SVGSVGElement>("pause-svg");
const themeSwitch = getRequiredElement<HTMLInputElement>("theme-switch-input");

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

interface ScheduledVisualBeat {
  time: number;
  beat: number;
}

/**
 * Schedule and play the beat for a duration
 * @param {number} startTime Start time of the beat in seconds since the Audio Context
 * @param {number} duration Duration of the beat in seconds 
 */
function playScheduledBeat(startTime: number, duration: number, audioBuffer: AudioBuffer) {
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
function startPlayingBeats(numberOfBeats: number, beatsPerMinute: number): boolean {
  const tickBuffer = audioBufferTick;
  const tockBuffer = audioBufferTock;
  if (tickBuffer === null || tockBuffer === null)
    return false;

  if (audioContext.state === 'suspended') {
    audioContext.resume(); // Required for autoplay policies
  }
  
  isPlaying = true;

  const beatInterval = SECONDS_IN_MINUTE / beatsPerMinute;
  let nextBeatTime = audioContext.currentTime;
  let currentBeat = 0;
  const scheduledVisualBeats: ScheduledVisualBeat[] = [];

  function updateScheduledVisualBeat() {
    if (!isPlaying)
      return;

    const currentTime = audioContext.currentTime;
    while (scheduledVisualBeats.length > 0) {
      const scheduledBeat = scheduledVisualBeats[0];
      if (scheduledBeat.time > currentTime)
        break;

      scheduledVisualBeats.shift();
      updateVisualActiveBeat(scheduledBeat.beat);
    }

    requestAnimationFrame(updateScheduledVisualBeat);
  }
  
  function scheduler() {

    if (!isPlaying) 
      return;

    const currentTime = audioContext.currentTime;
    if (nextBeatTime < currentTime) {
      const missedBeatCount = Math.ceil(
        (currentTime - nextBeatTime) / beatInterval,
      );
      nextBeatTime += missedBeatCount * beatInterval;
      currentBeat = (currentBeat + missedBeatCount) % numberOfBeats;
    }

    // Schedule beats for next WINDOW_SECONDS window
    while (nextBeatTime < currentTime + WINDOW_SECONDS) {
      const currentAudioBuffer = currentBeat === 0 ? tickBuffer : tockBuffer;
      if (currentAudioBuffer === null)
        return;
      playScheduledBeat(nextBeatTime, beatInterval / 2, currentAudioBuffer);
      scheduledVisualBeats.push({ time: nextBeatTime, beat: currentBeat });
      nextBeatTime += beatInterval;
      currentBeat = (currentBeat + 1) % numberOfBeats;
    }
    requestAnimationFrame(scheduler);
  }
  
  scheduler();
  updateScheduledVisualBeat();
  return true;
}

/**
 * Stop the metronome if playing
 */
function stopPlayingBeats() {
  if (isPlaying) {
    isPlaying = false;
    audioSource?.stop(); // Stop in the middle of beat
    audioSource?.disconnect();
    audioSource = null;
  }
}

/**
 * Highlight the beat at the given index
 * @param {number} currentBeat Index of the active beat's box. Starting from zero
 */
function updateVisualActiveBeat(currentBeat: number) {
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
function updateVisualBeatNumber(numberOfBeats: number) {
  beatBoxContainer.innerHTML = "";
  for (let i = 0; i < numberOfBeats; i++) 
    beatBoxContainer.innerHTML += '<div class="beat-box deactive-background"></div>';
}

/**
 * Toggle metronome play button visuality between pressed (playing) and stopped.
 */
function toggleButtonVisual() {
  if (isPlaying) {
    metronomeButton.classList.add("deactive-background");
    metronomeButton.classList.remove("active-background");    
    playSvgIcon.style.display = "none";
    pauseSvgIcon.style.display = "block";
    pauseSvgIcon.classList.add("active-fill");
    pauseSvgIcon.classList.remove("deactive-fill");
  }
  else {
    metronomeButton.classList.add("active-background");
    metronomeButton.classList.remove("deactive-background");
    pauseSvgIcon.style.display = "none";
    playSvgIcon.style.display = "block";
    playSvgIcon.classList.add("deactive-fill");
    playSvgIcon.classList.remove("active-fill");     
  }
}

/**
 * Returns true if a given variable is a positive integer
 * @param {number} n Number to be tested
 * @returns true if positive integer
 */
function isPositiveInteger(n: number) {
  return Number.isInteger(n) && n > 0;
}

/**
 * Set CSS color variables by Javascript
 * @param {string} activeColor Color string for active color
 * @param {string} deactiveColor Color string for deactive color
 */
function setCssColors(activeColor: string, deactiveColor: string) {
  document.documentElement.style.setProperty('--active-color', activeColor);
  document.documentElement.style.setProperty('--deactive-color', deactiveColor);
}

// Change number of beat boxes displayed when input value changed
numberOfBeatsInput.addEventListener("input", () => {
  let newNumberOfBeats = Number(numberOfBeatsInput.value);
  newNumberOfBeats = isPositiveInteger(newNumberOfBeats) ? newNumberOfBeats : 1;
  newNumberOfBeats = Math.min(MAX_NUM_OF_BEATS, newNumberOfBeats);
  updateVisualBeatNumber(newNumberOfBeats);
});

// Toggle playing metronome when button is pressed
// Disable fields when metronome is playing
metronomeButton.addEventListener("click", () => {
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
    if (startPlayingBeats(numberOfBeats, beatsPerMinute)) {
      numberOfBeatsInput.disabled = true;
      beatsPerMinuteInput.disabled = true;
      toggleButtonVisual();
    }
  }
});

// Get saved theme from localStorage (default: light)
// Auto-check if dark mode
document.addEventListener("DOMContentLoaded", () => {
  const html = document.documentElement;
  const savedTheme = localStorage.getItem("theme") || "light";
  html.setAttribute("data-theme", savedTheme);
  themeSwitch.checked = savedTheme === "dark";
  if (savedTheme === "dark") {
    setCssColors(ACTIVE_DARK, DEACTIVE_DARK);
    setStatusBarStyleDark();
  }
  else {
    setCssColors(ACTIVE_LIGHT, DEACTIVE_LIGHT);
    setStatusBarStyleLight();
  }
  
  // Update theme and save preference on switch
  themeSwitch.addEventListener("change", () => {
    const newTheme = themeSwitch.checked ? "dark" : "light";
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      setCssColors(ACTIVE_DARK, DEACTIVE_DARK);
      setStatusBarStyleDark();
    }
    else {
      setCssColors(ACTIVE_LIGHT, DEACTIVE_LIGHT);
      setStatusBarStyleLight();
    }
  });
});

// Add event listeners for max value exceeds
numberOfBeatsInput.addEventListener("input", () => {
  let newNumberOfBeats = Number(numberOfBeatsInput.value);
  if (isPositiveInteger(newNumberOfBeats) && newNumberOfBeats <= MAX_NUM_OF_BEATS)
    numberOfBeatsInput.classList.remove("warning-highlight");
  else
    numberOfBeatsInput.classList.add("warning-highlight");
});
beatsPerMinuteInput.addEventListener("input", () => {
  let beatsPerMinute = Number(beatsPerMinuteInput.value);
  if (isPositiveInteger(beatsPerMinute) && beatsPerMinute <= MAX_BPM)
    beatsPerMinuteInput.classList.remove("warning-highlight");
  else
    beatsPerMinuteInput.classList.add("warning-highlight");
});

// Set initial input values
numberOfBeatsInput.value = "4";
beatsPerMinuteInput.value = "60";

// Set initial button icon
playSvgIcon.style.display = "block";
playSvgIcon.classList.add("deactive-fill");
