// EggplantGuard - JavaScript matching the IDs in index.html
// Uses the Teachable Machine model URL supplied in the uploaded script.js.
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/jq8kSVI_-/";

let model = null;
let modelLoading = null;
let cameraStream = null;
let selectedImage = null;

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const imageStatus = document.getElementById("imageStatus");
const startCameraButton = document.getElementById("startCamera");
const capturePhotoButton = document.getElementById("capturePhoto");
const webcamVideo = document.getElementById("webcam");
const captureCanvas = document.getElementById("captureCanvas");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const classifyButton = document.getElementById("classifyButton");
const modelStatus = document.getElementById("modelStatus");

function setModelStatus(message, ready = false) {
  modelStatus.textContent = message;
  modelStatus.classList.toggle("ready", ready);
}

function setSelectedImage(source, label) {
  selectedImage = source;
  imagePreview.src = source;
  imagePreview.hidden = false;
  const emptyPreview = document.querySelector("#previewWrap .empty-preview");
  if (emptyPreview) emptyPreview.hidden = true;
  imageStatus.textContent = label || "Image ready";
  classifyButton.disabled = false;
}

imageInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    imageStatus.textContent = "Please choose an image file.";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => setSelectedImage(reader.result, file.name);
  reader.onerror = () => {
    imageStatus.textContent = "Could not read that image. Try another file.";
  };
  reader.readAsDataURL(file);
});

async function loadModel() {
  if (model) return model;
  if (modelLoading) return modelLoading;

  if (!window.tmImage) {
    throw new Error("The Teachable Machine library did not load. Check your internet connection and refresh the page.");
  }
  modelLoading = (async () => {
    setModelStatus("Loading AI model…");
    const base = MODEL_URL.endsWith("/") ? MODEL_URL : MODEL_URL + "/";
    const loadedModel = await tmImage.load(base + "model.json", base + "metadata.json");
    model = loadedModel;
    setModelStatus("AI model connected. Ready to classify.", true);
    return model;
  })();

  try {
    return await modelLoading;
  } catch (error) {
    modelLoading = null;
    setModelStatus("Could not load the AI model. Check the model URL and try again.");
    throw error;
  }
}

startCameraButton.addEventListener("click", async () => {
  startCameraButton.disabled = true;
  imageStatus.textContent = "Starting camera…";
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera access is unavailable. Open this site using HTTPS in a supported browser.");
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    webcamVideo.srcObject = cameraStream;
    webcamVideo.hidden = false;
    cameraPlaceholder.hidden = true;
    await webcamVideo.play();
    capturePhotoButton.disabled = false;
    imageStatus.textContent = "Camera is on. Capture a photo when ready.";
  } catch (error) {
    console.error("EggplantGuard camera error:", error);
    let message = error.message || "Camera could not be started.";
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      message = "Camera permission was blocked. Allow camera access in your browser's site settings, then try again.";
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      message = "No camera was found. Connect a camera or use Upload an image instead.";
    } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      message = "The camera may already be in use by another app. Close other apps using it and try again.";
    }
    imageStatus.textContent = message;
    alert(message);
  } finally {
    startCameraButton.disabled = false;
  }
});

capturePhotoButton.addEventListener("click", () => {
  if (!cameraStream || !webcamVideo.videoWidth) {
    alert("Start the camera and wait for the video preview before capturing.");
    return;
  }
  captureCanvas.width = webcamVideo.videoWidth;
  captureCanvas.height = webcamVideo.videoHeight;
  const context = captureCanvas.getContext("2d");
  context.drawImage(webcamVideo, 0, 0, captureCanvas.width, captureCanvas.height);
  setSelectedImage(captureCanvas.toDataURL("image/png"), "Photo captured from camera");
});

function getAdvice(className) {
  const name = className.toLowerCase();
  if (name.includes("healthy") && name.includes("leaf")) {
    return { icon: "🌿", description: "The image most closely matches healthy leaf examples.", advice: "Continue regular plant monitoring and maintain proper watering and field sanitation." };
  }
  if (name.includes("leaf miner") || name.includes("leaf-miner")) {
    return { icon: "🍃", description: "The image most closely matches leaf-miner damage examples.", advice: "Inspect nearby leaves for winding trails or larvae, remove heavily affected leaves when appropriate, and consult local agricultural guidance." };
  }
  if (name.includes("fresh") || name.includes("market-ready") || name.includes("market ready")) {
    return { icon: "🍆", description: "The image most closely matches fresh, market-ready fruit examples.", advice: "Check firmness and surface condition, then handle and store the eggplant carefully to prevent bruising." };
  }
  if (name.includes("damaged") || name.includes("borer")) {
    return { icon: "⚠️", description: "The image most closely matches damaged or borer-infested fruit examples.", advice: "Inspect for holes, frass, and internal damage. Separate affected fruit and seek local agricultural advice for pest management." };
  }
  return { icon: "🔎", description: "The model selected the closest class in its training data.", advice: "Review the image and compare it with the training examples. This AI result is an educational estimate, not a confirmed diagnosis." };
}

classifyButton.addEventListener("click", async () => {
  if (!selectedImage || !imagePreview.src) {
    alert("Choose an image or capture a photo first.");
    return;
  }
  classifyButton.disabled = true;
  classifyButton.textContent = "Classifying…";
  setModelStatus("Preparing AI classification…");
  try {
    const loadedModel = await loadModel();
    const predictions = await loadedModel.predict(imagePreview);
    if (!predictions || predictions.length === 0) {
      throw new Error("The model returned no predictions. Check that the trained model has classes.");
    }
    predictions.sort((a, b) => b.probability - a.probability);
    const best = predictions[0];
    const advice = getAdvice(best.className);
    document.getElementById("resultIcon").textContent = advice.icon;
    document.getElementById("resultLabel").textContent = best.className;
    document.getElementById("resultDescription").textContent = advice.description;
    document.getElementById("confidenceValue").textContent = Math.round(best.probability * 100) + "%";
    document.getElementById("confidenceBar").style.width = Math.round(best.probability * 100) + "%";
    document.getElementById("recommendation").textContent = advice.advice;
    document.getElementById("resultSection").hidden = false;
    setModelStatus("Classification complete.", true);
  } catch (error) {
    console.error("EggplantGuard classification error:", error);
    setModelStatus(error.message || "Classification failed. Open the browser console for details.");
    alert("Classification failed: " + (error.message || "Unknown error") + "\n\nCheck that the model URL is valid and that model.json and metadata.json can load.");
  } finally {
    classifyButton.disabled = !selectedImage;
    classifyButton.textContent = "✦ Classify image";
  }
});

window.addEventListener("beforeunload", () => {
  if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
});

setModelStatus("Model URL added. The AI model will load when you classify an image.");
