# EggplantGuard

EggplantGuard is a browser-based educational prototype for classifying eggplant leaf conditions and fruit quality with a Google Teachable Machine image model.

## Files
- `index.html` — page structure and library imports
- `style.css` — responsive visual design
- `script.js` — upload, webcam capture, model loading, prediction, and advice

## 1. Train and export your model
1. Open https://teachablemachine.withgoogle.com/
2. Create an **Image Project** with these four class labels:
   - `Healthy Leaf`
   - `Leaf Miner Damage`
   - `Fresh/Market-Ready Fruit`
   - `Damaged/Borer-Infested Fruit`
3. Add representative images to each class and click **Train Model**.
4. Test the model with images not used for training.
5. Select **Export Model** → **TensorFlow.js** → upload/host the model, if available.
6. Copy the URL provided by Teachable Machine.

## 2. Connect the model
Open `script.js` and replace:
```js
const MODEL_URL = "PASTE_YOUR_TEACHABLE_MACHINE_MODEL_URL_HERE/";
```
with your real model URL, preserving the trailing slash, for example:
```js
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/YOUR_REAL_MODEL_ID/";
```
The example above is only a format example. Use your own URL.

Make sure your model's class names match the four labels exactly. If the labels differ, update the labels in `guidance` in `script.js`.

## 3. Run locally
- Open the folder in Visual Studio Code.
- Install the **Live Server** extension, then right-click `index.html` and choose **Open with Live Server**.
- An internet connection is required for the hosted JavaScript libraries and a hosted Teachable Machine model.
- Camera access normally requires HTTPS or localhost. If camera permission fails, try image upload.

## 4. Publish on GitHub Pages
1. Create a GitHub repository named `EggplantGuard`.
2. Upload `index.html`, `style.css`, and `script.js` to the repository root.
3. Open **Settings → Pages**.
4. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
5. Wait for the published Pages URL and open it.
6. Test both image upload and camera access. Use the HTTPS published URL for camera permission.

## Important notes
- The model URL is not included because it must come from your own trained model.
- This prototype provides educational screening, not a certified plant diagnosis.
- Do not report accuracy figures such as 88.5% as measured results unless you have evaluated your model on a real held-out test set.
