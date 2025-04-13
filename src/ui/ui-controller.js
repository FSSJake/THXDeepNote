import { playTHXDeepNote } from "../thx-deep-note.js";
import { playCustomSound } from "../audio/custom-sound-generator.js";
import { Section } from "../audio/section.js";

import chordPresets from "../audio/chord-presets.js";

// Section counter
let sectionCounter = 1;

// Add a new section
function addSection() {
  const sectionsContainer = document.getElementById("sectionsContainer");

  if (!sectionsContainer) {
    console.error("Error: sectionsContainer element not found.");
    return;
  }

  sectionCounter++;
  const newSection = `
    <div id="section_${sectionCounter}" class="sound-section p-3 mb-3 bg-light rounded">
      <h5>Section ${sectionCounter}</h5>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Starting Sound</label>
          <select class="form-select" id="startType_${sectionCounter}">
            <option value="chord">Chord</option>
            <option value="range">Range</option>
          </select>
          <div id="startChord_${sectionCounter}" class="mt-2">
            <label class="form-label">Chord</label>
            <select class="form-select" id="startChordSelect_${sectionCounter}">
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="THX">THX</option>
            </select>
          </div>
          <div id="startRange_${sectionCounter}" class="mt-2" style="display: none">
            <label class="form-label">Min Frequency</label>
            <input type="number" class="form-control" id="startMinFreq_${sectionCounter}" value="100" min="20" max="20000" />
            <label class="form-label mt-2">Max Frequency</label>
            <input type="number" class="form-control" id="startMaxFreq_${sectionCounter}" value="300" min="20" max="20000" />
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label">End Sound</label>
          <select class="form-select" id="endType_${sectionCounter}">
            <option value="chord">Chord</option>
            <option value="range">Range</option>
          </select>
          <div id="endChord_${sectionCounter}" class="mt-2">
            <label class="form-label">Chord</label>
            <select class="form-select" id="endChordSelect_${sectionCounter}">
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
              <option value="F">F</option>
              <option value="G">G</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="THX">THX</option>
            </select>
          </div>
          <div id="endRange_${sectionCounter}" class="mt-2" style="display: none">
            <label class="form-label">Min Frequency</label>
            <input type="number" class="form-control" id="endMinFreq_${sectionCounter}" value="400" min="20" max="20000" />
            <label class="form-label mt-2">Max Frequency</label>
            <input type="number" class="form-control" id="endMaxFreq_${sectionCounter}" value="700" min="20" max="20000" />
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Number of Voices</label>
          <input type="number" class="form-control" id="numVoices_${sectionCounter}" value="10" min="1" max="50">
        </div>
        <div class="col-md-6">
          <label class="form-label">Voice Type</label>
          <select class="form-select" id="oscType_${sectionCounter}">
            <option value="sawtooth">Sawtooth</option>
            <option value="square">Square</option>
            <option value="sine">Sine</option>
            <option value="triangle">Triangle</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Movement Type</label>
          <select class="form-select" id="movementType_${sectionCounter}">
            <option value="direct">Direct</option>
            <option value="random">Random</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Start Type</label>
          <select class="form-select" id="startSpread_${sectionCounter}">
            <option value="even">Even Spread</option>
            <option value="random">Random</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Section Length (seconds)</label>
          <input type="number" class="form-control" id="sectionLength_${sectionCounter}" value="5" min="1" max="30">
        </div>
      </div>
      <div class="col-md-12 mt-3">
        <h6>EQ & Effects Controls</h6>
        <div class="row">
          <div class="col-md-4">
            <label class="form-label">Highpass Filter (Hz)</label>
            <input type="range" class="form-range" id="highpassFreq_${sectionCounter}" min="20" max="2000" value="80">
            <div class="d-flex justify-content-between">
              <small>20 Hz</small>
              <small id="highpassValue_${sectionCounter}">80 Hz</small>
              <small>2000 Hz</small>
            </div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Lowpass Filter (Hz)</label>
            <input type="range" class="form-range" id="lowpassFreq_${sectionCounter}" min="2000" max="20000" value="7000">
            <div class="d-flex justify-content-between">
              <small>2000 Hz</small>
              <small id="lowpassValue_${sectionCounter}">7000 Hz</small>
              <small>20000 Hz</small>
            </div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Reverb Amount</label>
            <input type="range" class="form-range" id="reverbAmount_${sectionCounter}" min="0" max="1" step="0.1" value="0.3">
            <div class="d-flex justify-content-between">
              <small>Dry</small>
              <small id="reverbValue_${sectionCounter}">30%</small>
              <small>Wet</small>
            </div>
          </div>
        </div>
      </div>
      <button class="btn btn-danger mt-3 float-end remove-section-btn">Remove</button>
    </div>
  `;

  sectionsContainer.insertAdjacentHTML("beforeend", newSection);

  // Add event listeners for the new section
  document
    .getElementById(`startType_${sectionCounter}`)
    .addEventListener("change", () => toggleStartInputs(sectionCounter));
  document
    .getElementById(`endType_${sectionCounter}`)
    .addEventListener("change", () => toggleEndInputs(sectionCounter));

  // Add EQ listeners for new section
  addEQListeners(sectionCounter);
}

// Remove a section
function removeSection(button) {
  const section = button.closest(".sound-section");
  section.remove();
}

// Toggle start inputs based on selection
function toggleStartInputs(sectionId) {
  const startType = document.getElementById(`startType_${sectionId}`).value;
  const startChord = document.getElementById(`startChord_${sectionId}`);
  const startRange = document.getElementById(`startRange_${sectionId}`);

  if (startType === "chord") {
    startChord.style.display = "block";
    startRange.style.display = "none";
  } else {
    startChord.style.display = "none";
    startRange.style.display = "block";
  }
}

// Toggle end inputs based on selection
function toggleEndInputs(sectionId) {
  const endType = document.getElementById(`endType_${sectionId}`).value;
  const endChord = document.getElementById(`endChord_${sectionId}`);
  const endRange = document.getElementById(`endRange_${sectionId}`);

  if (endType === "chord") {
    endChord.style.display = "block";
    endRange.style.display = "none";
  } else {
    endChord.style.display = "none";
    endRange.style.display = "block";
  }
}

// Add these functions before getSectionParams

function getStartPosition(sectionId) {
  const startType = document.getElementById(`startType_${sectionId}`).value;

  if (startType === "chord") {
    const selectedChord = document.getElementById(
      `startChordSelect_${sectionId}`
    ).value;
    console.log("Selected start chord:", selectedChord); // Debug log
    return selectedChord;
  } else {
    return [
      Number(document.getElementById(`startMinFreq_${sectionId}`).value),
      Number(document.getElementById(`startMaxFreq_${sectionId}`).value),
    ];
  }
}

function getEndPosition(sectionId) {
  const endType = document.getElementById(`endType_${sectionId}`).value;

  if (endType === "chord") {
    const selectedChord = document.getElementById(
      `endChordSelect_${sectionId}`
    ).value;
    console.log("Selected end chord:", selectedChord); // Debug log
    return selectedChord;
  } else {
    return [
      Number(document.getElementById(`endMinFreq_${sectionId}`).value),
      Number(document.getElementById(`endMaxFreq_${sectionId}`).value),
    ];
  }
}

// Collect parameters from the UI
function getSectionParams(sectionId) {
  const sectionLength = Number(
    document.getElementById(`sectionLength_${sectionId}`).value
  );
  console.log(`Section ${sectionId} length from UI:`, sectionLength);

  return {
    startType: document.getElementById(`startType_${sectionId}`).value,
    startPos: getStartPosition(sectionId),
    endPos: getEndPosition(sectionId),
    numVoices: Number(document.getElementById(`numVoices_${sectionId}`).value),
    oscType: document.getElementById(`oscType_${sectionId}`).value,
    movementType: document.getElementById(`movementType_${sectionId}`).value,
    startSpread: document.getElementById(`startSpread_${sectionId}`).value,
    sectionLength: sectionLength,
    highpassFreq: Number(
      document.getElementById(`highpassFreq_${sectionId}`).value
    ),
    lowpassFreq: Number(
      document.getElementById(`lowpassFreq_${sectionId}`).value
    ),
    reverbAmount: Number(
      document.getElementById(`reverbAmount_${sectionId}`).value
    ),
    isLastSection:
      document.querySelectorAll(".sound-section").length === sectionId,
  };
}

// Add event listeners for EQ sliders
function addEQListeners(sectionId) {
  const highpassSlider = document.getElementById(`highpassFreq_${sectionId}`);
  const lowpassSlider = document.getElementById(`lowpassFreq_${sectionId}`);
  const reverbSlider = document.getElementById(`reverbAmount_${sectionId}`);
  const highpassValue = document.getElementById(`highpassValue_${sectionId}`);
  const lowpassValue = document.getElementById(`lowpassValue_${sectionId}`);
  const reverbValue = document.getElementById(`reverbValue_${sectionId}`);

  if (highpassSlider) {
    highpassSlider.addEventListener("input", () => {
      highpassValue.textContent = `${highpassSlider.value} Hz`;
    });
  }

  if (lowpassSlider) {
    lowpassSlider.addEventListener("input", () => {
      lowpassValue.textContent = `${lowpassSlider.value} Hz`;
    });
  }

  if (reverbSlider) {
    reverbSlider.addEventListener("input", () => {
      const percentage = Math.round(reverbSlider.value * 100);
      reverbValue.textContent = `${percentage}%`;
    });
  }
}

function connectSectionsForTransition(sectionParams) {
  if (sectionParams.length <= 1) return sectionParams;

  // For each section (except the last), set target EQ values to the next section's starting EQ
  for (let i = 0; i < sectionParams.length - 1; i++) {
    const currentSection = sectionParams[i];
    const nextSection = sectionParams[i + 1];

    // Set target EQ values to the next section's starting values
    currentSection.targetHighpassFreq = nextSection.highpassFreq;
    currentSection.targetLowpassFreq = nextSection.lowpassFreq;

    console.log(`Connecting section ${i + 1} to ${i + 2} for EQ transition:`, {
      highpass: `${currentSection.highpassFreq} → ${currentSection.targetHighpassFreq}`,
      lowpass: `${currentSection.lowpassFreq} → ${currentSection.targetLowpassFreq}`,
    });
  }

  return sectionParams;
}

// Play custom sound from UI settings
function playCustomSoundFromUI() {
  const sections = document.querySelectorAll(".sound-section");
  const sectionParams = Array.from(sections)
    .map((section, index) => {
      const params = getSectionParams(index + 1);
      params.isLastSection = index === sections.length - 1;
      return params;
    })
    .filter((params) => params !== null);

  // Create and resume AudioContext
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  console.log("AudioContext state:", audioCtx.state);

  if (audioCtx.state === "suspended") {
    audioCtx.resume().then(() => console.log("AudioContext resumed"));
  }

  let currentTime = audioCtx.currentTime;
  console.log("Initial currentTime:", currentTime);

  // Create a master gain node for seamless transitions
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);

  // Ensure masterGain is set to an audible level
  masterGain.gain.value = 0.8;

  // Process sections sequentially with seamless transitions
  let previousSectionOutput = null;

  sectionParams.forEach((params, index) => {
    const section = new Section({
      ...params,
      startTime: currentTime,
    });

    console.log(`Section ${index + 1} scheduling:`, {
      startTime: currentTime,
      duration: section.duration,
      frequencies: section.startPos,
    });

    // Schedule the section and connect its output to the master gain
    const sectionOutput = section.schedule(
      audioCtx,
      masterGain,
      previousSectionOutput
    );
    previousSectionOutput = sectionOutput; // Pass the output to the next section

    currentTime += section.duration;
  });
}

// Download custom sound from UI settings
function downloadCustomSoundFromUI() {
  const sections = document.querySelectorAll(".sound-section");
  const sectionParams = Array.from(sections).map((section, index) =>
    getSectionParams(index + 1)
  );

  const startPos = sectionParams.map((params) => params.startPos);
  const endPos = sectionParams.map((params) => params.endPos);
  const numVoices = sectionParams.map((params) => params.numVoices);
  const oscType = sectionParams.map((params) => params.oscType);
  const soundLength = sectionParams.reduce(
    (total, params) => total + params.sectionLength,
    0
  );
  const sectionSpeed = sectionParams.map((params) => params.sectionLength);
  const sectionModes = sectionParams.map((params) => params.movementType);
  const sectionRanges = sectionParams.map((params) =>
    params.startType === "chord" ? [100, 300] : [100, 700]
  );
  const randomSteps = 0;
  const movePercentage = 1.0;

  console.log("Downloading custom sound with parameters:", {
    startPos,
    endPos,
    numVoices,
    oscType,
    soundLength,
    numSections: sections.length,
    sectionSpeed,
    sectionModes,
    sectionRanges,
    randomSteps,
    movePercentage,
  });

  playCustomSound({
    startPos,
    endPos,
    numVoices,
    oscType,
    soundLength,
    numSections: sections.length,
    sectionSpeed,
    sectionModes,
    sectionRanges,
    randomSteps,
    movePercentage,
    downloadCallback: createDownload,
  });
}

// Initialize event listeners when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Ensure all required elements exist before adding event listeners
  const playBtn = document.getElementById("playBtn");
  const downloadTHXBtn = document.getElementById("downloadTHXBtn");
  const addSectionBtn = document.getElementById("addSectionBtn");
  const playCustomBtn = document.getElementById("playCustomBtn");
  const downloadCustomBtn = document.getElementById("downloadCustomBtn");
  const sectionsContainer = document.getElementById("sectionsContainer");

  if (playBtn) playBtn.onclick = () => playTHXDeepNote(false);
  if (downloadTHXBtn) downloadTHXBtn.onclick = () => playTHXDeepNote(true);
  if (addSectionBtn) addSectionBtn.onclick = addSection;
  if (playCustomBtn) playCustomBtn.onclick = playCustomSoundFromUI;
  if (downloadCustomBtn) downloadCustomBtn.onclick = downloadCustomSoundFromUI;

  if (sectionsContainer) {
    sectionsContainer.addEventListener("click", function (event) {
      if (event.target.classList.contains("remove-section-btn")) {
        removeSection(event.target);
      }
    });
  }

  // Add event listeners for the initial section
  const startType1 = document.getElementById("startType_1");
  const endType1 = document.getElementById("endType_1");

  if (startType1)
    startType1.addEventListener("change", () => toggleStartInputs(1));
  if (endType1) endType1.addEventListener("change", () => toggleEndInputs(1));

  // Add EQ listeners for the first section
  addEQListeners(1);
});

// Function to handle download creation
function createDownload(wavBlob) {
  const url = URL.createObjectURL(wavBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = "CustomSound.wav";
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();

  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(downloadLink);
  }, 100);
}

// Define the soundController object and assign it to the global window object
const soundController = {
  updateTypeControls: (sectionId, type) => {
    if (type === "start") {
      toggleStartInputs(sectionId);
    } else if (type === "end") {
      toggleEndInputs(sectionId);
    }
  },
};

window.soundController = soundController;

// Export the createDownload function
export { createDownload };
