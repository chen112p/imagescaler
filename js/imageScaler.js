// JavaScript
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let points = []; // To store trace points
let maxpoint = null; // store the max point
let tempImage = null; // To store the uploaded image
let colorBar = null; // To store the color bar from the JSON file
let drawingEnabled = false;
let getMaxPoint = false;
/*------------upload images-------------*/
document.getElementById('uploadButton').addEventListener('click', () => {
  document.getElementById('uploadButton').classList.add('used'); // Add the 'used' class to change color
  document.getElementById('fileInput').click();
  
});
document.getElementById('fileInput').addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (file) {
    const img = new Image();

    img.onload = () => {
      tempImage = img;

      // Set a fixed canvas size (e.g., 800x600 or adjust as needed)
      const canvasWidth = 800;
      const canvasHeight = 600;

      // Resize the canvas
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Calculate the scaling factor to fit the image fully in the canvas
      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);

      // Calculate the scaled image dimensions
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the image in the canvas
      const offsetX = (canvasWidth - scaledWidth) / 2;
      const offsetY = (canvasHeight - scaledHeight) / 2;

      // Draw the scaled and centered image onto the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas first
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      appendMessage('Image uploaded and resized to fit within the canvas!');
    };

    img.src = URL.createObjectURL(file);
  }
});

/*------------------upload color bar------------*/
document.getElementById('uploadColorBarButton').addEventListener('click', () => {
  document.getElementById('uploadColorBarButton').classList.add('used'); // Add the 'used' class to change color
  document.getElementById('colorBarInput').click();
});
document.getElementById('colorBarInput').addEventListener('change', (event) => {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        colorBar = JSON.parse(reader.result);
        console.log('Color Bar Loaded:', colorBar);
        try{
          appendMessage('Color map "' + colorBar[0]['Name'] + '" successfully loaded!');
        }
        catch (error) {
          appendMessage('Color map successfully loaded!');
        }
      } catch (error) {
        appendMessage('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  }
});
/*--------------- Draw area------------*/
document.getElementById('drawArea').addEventListener('click', () => {
  drawingEnabled = true;
  points = []; // Reset points when enabling new drawing
  document.getElementById('drawArea').classList.add('used'); // Add the 'used' class to change color
});
/*----------------Select Peak-----------*/
/*document.getElementById('pickPeak').addEventListener('click', () => {
  getMaxPoint = true;
  maxpoint = [];
  document.getElementById('pickPeak').classList.add('used'); // Add the 'used' class to change color
});*/
/*------------------Apply factor-------------*/
document.getElementById('factor').addEventListener('click', () => {
  // Display a pop-up window to input a value
  const pumpfactor = prompt("Please enter a factor value:");

  // Check if the user entered a value or canceled the prompt
  if (pumpfactor !== null) {
    if (isNaN(pumpfactor) || pumpfactor.trim() === "") {
      // If the input is not a valid numeric value
      appendMessage("Please enter a valid numeric value.");
    } 
    else if (!colorBar || !colorBar[0]['RGBPoints']) {
      appendMessage("Color bar not loaded or invalid.");
      return;
    } 
    else {
      console.log("User entered a valid numeric value:", pumpfactor);
      appendMessage("Applying factor:" + pumpfactor)
      // Add the 'used' class to change the button color
      document.getElementById('factor').classList.add('used');
      applyFactor2Pixels(pumpfactor);
    }
  }
  else {
    console.log("User canceled the input.");
  }
});
/*----------------save image--------------*/
document.getElementById('saveImg').addEventListener('click', () => {
  saveCanvasAsImage();
  document.getElementById('drawArea').classList.add('used');
});
/*----------------refresh page------------*/
document.getElementById("reset").addEventListener("click", () => {
  location.reload(true); // Reload the current page
});
/*----------------Canvas functions----------*/
canvas.addEventListener('mousedown', () => {
  if (!drawingEnabled) return;
  isDrawing = true;
  points.length = 0; // Clear previous points
});

// Continue Drawing the Trace
canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing || !drawingEnabled) return;

  const rect = canvas.getBoundingClientRect();

  // Scale the mouse position to match the canvas resolution
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  // Store the point
  points.push({ x, y });

  // Redraw the image and trace
  if (tempImage) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate the scaling factor to fit the image within the canvas
    const imgAspectRatio = tempImage.width / tempImage.height;
    const canvasAspectRatio = canvas.width / canvas.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspectRatio > canvasAspectRatio) {
      // Image is wider than canvas
      drawWidth = canvas.width;
      drawHeight = canvas.width / imgAspectRatio;
      offsetX = 0;
      offsetY = (canvas.height - drawHeight) / 2; // Center vertically
    } else {
      // Image is taller than canvas
      drawWidth = canvas.height * imgAspectRatio;
      drawHeight = canvas.height;
      offsetX = (canvas.width - drawWidth) / 2; // Center horizontally
      offsetY = 0;
    }

    ctx.drawImage(tempImage, offsetX, offsetY, drawWidth, drawHeight); // Redraw the image with proper scaling
  }

  // Draw the traced points
  ctx.beginPath();
  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.stroke();
});


// End the Trace
canvas.addEventListener('mouseup', () => {
  if (!drawingEnabled){
    return;
  }
  isDrawing = false;

  // Check if there are enough points to calculate distance
  if (points.length < 2) {
    appendMessage('Not enough points to close the shape');
    return;
  }

  // Automatically close the shape if not closed
  const start = points[0];
  const end = points[points.length - 1];
  const distance = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );

  if (distance > 10) {
    points.push(start); // Close the shape by connecting to the start point
  }

  // Draw the closed shape
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'red';
  ctx.stroke();
  appendMessage('Selected area is automatically closed')
  drawingEnabled = false;
});
/*
canvas.addEventListener('click', (e) => {
  if (!getMaxPoint){
    return;
  }
  const rect = canvas.getBoundingClientRect();

  // Scale the mouse position to match the canvas resolution
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  // Record the coordinates in maxpoint
  maxpoint = { x, y };
  ctx.beginPath();
  ctx.arc(maxpoint.x, maxpoint.y, 5, 0, 2 * Math.PI); // Draw a small circle
  ctx.fillStyle = 'blue';
  ctx.fill();
  getMaxPoint = false
});
*/
function applyFactor2Pixels(pumpfactor) {
  const rgbPoints = colorBar[0]['RGBPoints'];

  // Clear the canvas and redraw the image at correct dimensions
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate the scaling factor and center the image properly
  const imgAspectRatio = tempImage.width / tempImage.height;
  const canvasAspectRatio = canvas.width / canvas.height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgAspectRatio > canvasAspectRatio) {
    // Image is wider than canvas
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgAspectRatio;
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2; // Center vertically
  } else {
    // Image is taller than canvas
    drawWidth = canvas.height * imgAspectRatio;
    drawHeight = canvas.height;
    offsetX = (canvas.width - drawWidth) / 2; // Center horizontally
    offsetY = 0;
  }

  ctx.drawImage(tempImage, offsetX, offsetY, drawWidth, drawHeight);

  // Get the pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // Get the bounding box of the selected shape for optimization
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));

  const data = imageData.data;

  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
      if (ctx.isPointInPath(x, y)) {
        const index = (y * imageData.width + x) * 4; // RGBA index
        const r = data[index] / 255;
        const g = data[index + 1] / 255;
        const b = data[index + 2] / 255;

        let scalarVal = findScalarFromRGB(rgbPoints, [r, g, b]) * pumpfactor;

        let newRGB = getRGBFromScalar(rgbPoints, scalarVal);

        data[index] = newRGB[0] * 255;
        data[index + 1] = newRGB[1] * 255;
        data[index + 2] = newRGB[2] * 255;
        data[index + 3] = 255; // Alpha
      }
    }
  }

  // Put the updated image data back on the canvas
  ctx.putImageData(imageData, 0, 0);

  // Update tempImage with the modified canvas content
  tempImage = new Image();
  tempImage.src = canvas.toDataURL();

  appendMessage('Applied factor ' + pumpfactor + ' to the selected area.');

  // Reset button states
  document.getElementById('drawArea').classList.remove('used');
  document.getElementById('factor').classList.remove('used');
}


function findScalarFromRGB(rgbPoints, targetRGB) {
  // Parse the rgbPoints array into groups of [scalar, R, G, B]
  const colorScale = [];
  for (let i = 0; i < rgbPoints.length; i += 4) {
    const scalar = rgbPoints[i];
    const r = rgbPoints[i + 1];
    const g = rgbPoints[i + 2];
    const b = rgbPoints[i + 3];
    colorScale.push({ scalar, r, g, b });
  }

  // Find the closest RGB match
  let closestMatch = null;
  let smallestDistance = Infinity;

  colorScale.forEach(({ scalar, r, g, b }) => {
    const distance = Math.sqrt(
      Math.pow(targetRGB[0] - r, 2) +
      Math.pow(targetRGB[1] - g, 2) +
      Math.pow(targetRGB[2] - b, 2)
    );

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestMatch = scalar;
    }
  });

  return closestMatch;
}
function getRGBFromScalar(rgbPoints, scalarValue) {
  // Parse the rgbPoints array into groups of [scalar, R, G, B]
  const colorScale = [];
  for (let i = 0; i < rgbPoints.length; i += 4) {
    const scalar = rgbPoints[i];
    const r = rgbPoints[i + 1];
    const g = rgbPoints[i + 2];
    const b = rgbPoints[i + 3];
    colorScale.push({ scalar, r, g, b });
  }

  // Check bounds
  if (scalarValue <= colorScale[0].scalar) {
    // Return the smallest bound
    return [colorScale[0].r, colorScale[0].g, colorScale[0].b];
  }
  if (scalarValue >= colorScale[colorScale.length - 1].scalar) {
    // Return the largest bound
    return [
      colorScale[colorScale.length - 1].r,
      colorScale[colorScale.length - 1].g,
      colorScale[colorScale.length - 1].b,
    ];
  }

  // Find the two closest points for interpolation
  for (let i = 0; i < colorScale.length - 1; i++) {
    const point1 = colorScale[i];
    const point2 = colorScale[i + 1];

    if (scalarValue === point1.scalar) {
      return [point1.r, point1.g, point1.b]; // Exact match
    }

    if (scalarValue > point1.scalar && scalarValue < point2.scalar) {
      // Interpolate RGB values
      const t = (scalarValue - point1.scalar) / (point2.scalar - point1.scalar);
      const r = point1.r + t * (point2.r - point1.r);
      const g = point1.g + t * (point2.g - point1.g);
      const b = point1.b + t * (point2.b - point1.b);
      return [r, g, b];
    }
  }

  // Default case (should not be reached)
  return null;
}

function saveCanvasAsImage() {
  // Convert the canvas to a data URL (base64 image)
  const imageData = canvas.toDataURL("image/png");
  
  // Create a temporary <a> element
  const link = document.createElement("a");
  link.href = imageData;
  link.download = "updated_image.png"; // Specify the file name
  
  // Programmatically click the link to trigger the download
  link.click();
}


// Function to append messages to the message box
function appendMessage(message) {
  const messageBox = document.getElementById("messageBox");

  // Create a new paragraph for the message
  const newMessage = document.createElement("p");
  newMessage.textContent = message;

  // Append the message to the box
  messageBox.appendChild(newMessage);

  // Scroll to the bottom of the message box
  messageBox.scrollTop = messageBox.scrollHeight;
}
