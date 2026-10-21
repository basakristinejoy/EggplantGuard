const MODEL_URL = https://teachablemachine.withgoogle.com/models/_viIsIFq8/

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewWrap = document.getElementById("previewWrap");
const imageStatus = document.getElementById("imageStatus");
const classifyButton = document.getElementById("classifyButton");
const modelStatus = document.getElementById("modelStatus");
const webcam = document.getElementById("webcam");
const captureCanvas = document.getElementById("captureCanvas");
const cameraPlaceholder = document.getElementById("cameraPlaceholder");
const startCameraButton = document.getElementById("startCamera");
const capturePhotoButton = document.getElementById("capturePhoto");

let model = null;
let cameraStream = null;
let currentImageUrl = null;

const guidance = {
  "Healthy Leaf": {
    icon: "🌿",
    description: "The image most closely matches the model's healthy-leaf examples.",
    recommendation: "Continue routine crop monitoring. Check leaves regularly and keep plants well cared for. This prediction is a visual screening result, not proof that the plant is disease-free."
  },
  "Leaf Miner Damage": {
    icon: "🍃",
    description: "The image most closely matches the model's leaf-miner-damage examples.",
    recommendation: "Inspect nearby leaves for similar winding trails. Remove heavily affected leaves when appropriate and dispose of them responsibly. Ask a local agricultural technician for advice if damage spreads."
  },
  "Fresh/Market-Ready Fruit": {
    icon: "🍆",
    description: "The image most closely matches the model's fresh/market-ready fruit examples.",
    recommendation: "Check firmness, size, skin condition, and local market standards before harvesting. The AI result alone cannot confirm freshness or food safety."
  },
  "Damaged/Borer-Infested Fruit": {
    icon: "⚠️",
    description: "The image most closely matches the model's damaged/borer-infested fruit examples.",
    recommendation: "Inspect the fruit for holes, frass, and soft or rotting areas. Separate visibly damaged fruit and check nearby plants. Seek local agricultural guidance to confirm the cause before choosing a control method."
  }
};

function setModelMessage(message, ready = false) {
  modelStatus.textContent = message;
  modelStatus.classList.toggle("ready", ready);
}

function showSelectedImage(fileOrBlob, label) {
  if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
  currentImageUrl = URL.createObjectURL(fileOrBlob);
  imagePreview.src = currentImageUrl;
  imagePreview.hidden = false;
  const empty = previewWrap.querySelector(".empty-preview");
  if (empty) empty.hidden = true;
  imageStatus.textContent = label;
  classifyButton.disabled = false;
  document.getElementById("resultSection").hidden = true;
}

imageInput.addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    alert("Please select a JPG or PNG image.");
    imageInput.value = "";
    return;
  }
  showSelectedImage(file, file.name);
});

async function loadModel() {
  if (MODEL_URL.includes("PASTE_YOUR")) {
    setModelMessage("Add your Teachable Machine model URL in script.js to enable AI classification.");
    return;
  }
  try {
    setModelMessage("Loading AI model...");
    model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");
    setModelMessage("AI model loaded. You can classify your image.", true);
  } catch (error) {
    console.error("Model loading error:", error);
    setModelMessage("Could not load model. Check the model URL and your internet connection.");
  }
}

classifyButton.addEventListener("click", async () => {
  if (!imagePreview.src || imagePreview.hidden) {
    alert("Please upload or capture an image first.");
    return;
  }
  if (!model) {
    alert("The AI model is not connected yet. Add your model URL in script.js and reload the page.");
    return;
  }
  classifyButton.disabled = true;
  classifyButton.textContent = "Analyzing image...";
  try {
    const predictions = await model.predict(imagePreview);
    predictions.sort((a, b) => b.probability - a.probability);
    const best = predictions[0];
    const label = best.className;
    const confidence = Math.round(best.probability * 100);
    const info = guidance[label] || {
      icon: "🔎",
      description: "The model returned a class not listed in the app's guidance.",
      recommendation: "Check that your Teachable Machine class names exactly match the four required categories, then update the guidance in script.js if needed."
    };
    document.getElementById("resultIcon").textContent = info.icon;
    document.getElementById("resultLabel").textContent = label;
    document.getElementById("resultDescription").textContent = info.description;
    document.getElementById("confidenceValue").textContent = confidence + "%";
    document.getElementById("confidenceBar").style.width = confidence + "%";
    document.getElementById("recommendation").textContent = info.recommendation;
    document.getElementById("resultSection").hidden = false;
    document.getElementById("resultSection").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    console.error("Prediction error:", error);
    alert("Could not classify this image. Try a clearer JPG or PNG image and try again.");
  } finally {
    classifyButton.disabled = false;
    classifyButton.textContent = "✦ Classify image";
  }
});

startCameraButton.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Camera access is not available in this browser or page context. Use HTTPS or localhost, or upload an image instead.");
    return;
  }
  try {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    webcam.srcObject = cameraStream;
    webcam.hidden = false;
    cameraPlaceholder.hidden = true;
    capturePhotoButton.disabled = false;
    startCameraButton.textContent = "Restart camera";
  } catch (error) {
    console.error("Camera error:", error);
    alert("Camera access was blocked or unavailable. Allow camera permission in your browser, or upload an image.");
  }
});

capturePhotoButton.addEventListener("click", () => {
  if (!cameraStream || !webcam.videoWidth) {
    alert("Start the camera and wait for the preview before capturing.");
    return;
  }
  captureCanvas.width = webcam.videoWidth;
  captureCanvas.height = webcam.videoHeight;
  captureCanvas.getContext("2d").drawImage(webcam, 0, 0, captureCanvas.width, captureCanvas.height);
  captureCanvas.toBlob((blob) => {
    if (blob) showSelectedImage(blob, "Webcam snapshot");
  }, "image/jpeg", 0.92);
});

window.addEventListener("beforeunload", () => {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
});

loadModel();
