document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");

  let isSelected = false; // if a rectangular area is selected
  let isDragging = false; // if we're currently dragging the selected area
  let selectedDrawings = [];

  var preferredColor = "black";
  var eraserModeOn = false;
  var allpoints = [];

  const canvas = document.getElementById("gl-canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const MOVABLE_AREA_SIZE = 100;
  const fileBtn = document.getElementById("up-file");
  const uploadTxt = document.getElementById("txt");

  var currentLayerIndex = 0;
  var layers = [
    {
      triangles: [],
      z: -0.99,
      canvas: document.createElement("canvas"),
      canvasCtx: 0,
    },
    {
      triangles: [],
      z: -0.74,
      canvas: document.createElement("canvas"),
      canvasCtx: 0,
    },
    {
      triangles: [],
      z: -0.49,
      canvas: document.createElement("canvas"),
      canvasCtx: 0,
    },
  ];

  layers.forEach((layer) => {
    layer.canvasCtx = layer.canvas.getContext("2d");
  });

  // Make sure each off-screen canvas has the same dimensions as the main canvas.
  for (let layer of layers) {
    layer.canvas.width = canvas.width;
    layer.canvas.height = canvas.height;
  }

  var moveOn = false;
  var first = true;

  let canvasBuffer;

  let buffer = document.createElement("canvas");
  let bufferCtx = buffer.getContext("2d");

  buffer.width = canvas.width;
  buffer.height = canvas.height;

  let panX = 0;
  let panY = 0;
  let zoom = 1;
  let zoomMode = false;

  let isSelecting = false;
  let selectionRect = { startX: 0, startY: 0, endX: 0, endY: 0 };
  let lastPos = { x: 0, y: 0 };

  let triangles = [];

  if (!ctx) {
    alert("Your browser does not support canvas!");
    return;
  }

  console.log("Context obtained", ctx);

  let drawing = false;
  const states = [];
  let currentStateIndex = -1;
  const maxStates = 10;
  const numSquares = 60; // number of squares per row/column
  const squareSize = canvas.width / numSquares;

  let isCopyMode = false;
  let isMoveMode = false;
  let startX, startY;
  let selectedImageData = null;
  let imgX, imgY, imgWidth, imgHeight;

  let vertices = [];
  let indices = [];
  let colors = [];

  document.getElementById("copyBtn").addEventListener("click", () => {
    isCopyMode = true;
    isMoveMode = !isMoveMode;
    isSelecting = !isSelecting;
    drawing = false;
    if (isCopyMode) {
      isMoveMode = false;
      unclick("brush-btn");
      unclick("zoomin");
      isSelecting = true;
      canvas.style.cursor = "move";
      zoomMode = false;
      drawing = false;
      deactivateEraser();
    } else {
      canvas.style.cursor = "default";
    }
  });

  document.getElementById("moveBtn").addEventListener("click", () => {
    isCopyMode = !isCopyMode;
    isMoveMode = true;
    isSelecting = !isSelecting;
    drawing = false;
    if (isMoveMode) {
      isCopyMode = false;
      unclick("brush-btn");
      unclick("zoomin");
      isSelecting = true;
      canvas.style.cursor = "move";
      zoomMode = false;
      drawing = false;
      deactivateEraser();
    } else {
      canvas.style.cursor = "default";
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (isCopyMode) {
      if (isSelecting) {
        selectionRect.endX = event.clientX - canvas.offsetLeft;
        selectionRect.endY = event.clientY - canvas.offsetTop;
        drawWithTransformations();
      } else if (isDragging && selectedImageData) {
        console.log(
          "isSelecting false and inside the selectedImageData scope!"
        );
        let dx = (event.clientX - canvas.offsetLeft - lastPos.x) / zoom;
        let dy = (event.clientY - canvas.offsetTop - lastPos.y) / zoom;

        imgX += dx;
        imgY += dy;

        if (isCopyMode) {
          layers[currentLayerIndex].canvasCtx.putImageData(canvasBuffer, 0, 0); // Draw the original canvas
        } else {
          ctx.clearRect(imgX - dx, imgY - dy, imgWidth, imgHeight); // Clear the previous position of selected area
        }
        layers[currentLayerIndex].canvasCtx.putImageData(
          selectedImageData,
          imgX,
          imgY
        );

        lastPos.x = event.clientX - canvas.offsetLeft;
        lastPos.y = event.clientY - canvas.offsetTop;

        isSelecting = false;
        drawWithTransformations();
      }
    }
    if (isMoveMode) {
      if (isSelecting) {
        selectionRect.endX = event.clientX - canvas.offsetLeft;
        selectionRect.endY = event.clientY - canvas.offsetTop;
        drawWithTransformations();
      } else if (isDragging && selectedImageData) {
        console.log(
          "isSelecting false and inside the selectedImageData scope!"
        );
        let dx = (event.clientX - canvas.offsetLeft - lastPos.x) / zoom;
        let dy = (event.clientY - canvas.offsetTop - lastPos.y) / zoom;

        imgX += dx;
        imgY += dy;

        layers[currentLayerIndex].canvasCtx.putImageData(canvasBuffer, 0, 0);
        layers[currentLayerIndex].canvasCtx.putImageData(
          selectedImageData,
          imgX,
          imgY
        );

        lastPos.x = event.clientX - canvas.offsetLeft;
        lastPos.y = event.clientY - canvas.offsetTop;

        isSelecting = false;
        drawWithTransformations();
      }
    }
  });

  function getTransformedMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left - panX) / zoom,
      y: (evt.clientY - rect.top - panY) / zoom,
    };
  }

  canvas.addEventListener("mousemove", function (e) {
    const currentLayerZ = layers[currentLayerIndex].z;
    //çizmek için
    if (drawing) {
      const pos = getTransformedMousePos(canvas, e);
      const i = Math.floor(pos.x / squareSize);
      const j = Math.floor(pos.y / squareSize);
      const relX = pos.x - i * squareSize;
      const relY = pos.y - j * squareSize;

      // Determine which triangle to fill
      if (relX > relY) {
        if (squareSize - relX > relY)
          drawTriangle(i, j, "top", preferredColor, currentLayerZ);
        else drawTriangle(i, j, "right", preferredColor, currentLayerZ);
      } else {
        if (squareSize - relX > relY)
          drawTriangle(i, j, "left", preferredColor, currentLayerZ);
        else drawTriangle(i, j, "bottom", preferredColor, currentLayerZ);
      }
      afterDrawing();
    }
  });

  function drawWithTransformations() {
    // console.log("Move mode: " + isCopyMode);
    // console.log("Selecting mode: " + isSelecting);
    ctx.save(); // Save the current state
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.translate(panX, panY); // Move the canvas
    ctx.scale(zoom, zoom); // Zoom in/out

    // Draw the buffer.
    //ctx.drawImage(buffer, 0, 0);
    renderCanvas();

    ctx.restore(); // Restore the original state

    if (isSelecting) {
      ctx.strokeStyle = "black";
      ctx.fillStyle = "black";
      ctx.fill();
      ctx.strokeRect(
        selectionRect.startX,
        selectionRect.startY,
        selectionRect.endX - selectionRect.startX,
        selectionRect.endY - selectionRect.startY
      );
    }
  }

  canvas.addEventListener(
    //Yakınlaştırmak için
    "wheel",
    function (e) {
      if (!zoomMode) return;
      e.preventDefault();
      const scaleFactor = 1.1;
      const cursorX = e.clientX - canvas.getBoundingClientRect().left;
      const cursorY = e.clientY - canvas.getBoundingClientRect().top;

      console.log("cursorX: " + cursorX);
      console.log("cursorY: " + cursorY);

      if (e.deltaY < 0) {
        // Zoom in
        zoom *= scaleFactor;
        panX -= cursorX * (scaleFactor - 1);
        panY -= cursorY * (scaleFactor - 1);
      } else {
        // Zoom out
        zoom /= scaleFactor;
        panX += cursorX * (1 - 1 / scaleFactor);
        panY += cursorY * (1 - 1 / scaleFactor);
      }

      drawWithTransformations();
    },
    { passive: false }
  );
  // Event Listeners

  canvas.addEventListener("mouseup", (event) => {
    if ((isCopyMode || isMoveMode) && isSelecting) {
      isSelecting = false;
      isSelected = true;
      // Store the position and dimensions of the selected area
      imgX = Math.min(selectionRect.startX, selectionRect.endX);
      imgY = Math.min(selectionRect.startY, selectionRect.endY);
      imgWidth = Math.abs(selectionRect.endX - selectionRect.startX);
      imgHeight = Math.abs(selectionRect.endY - selectionRect.startY);

      if (imgWidth > 0 && imgHeight > 0) {
        // check if the selected area has a valid size
        selectedImageData = layers[currentLayerIndex].canvasCtx.getImageData(
          imgX,
          imgY,
          imgWidth,
          imgHeight
        );

        console.log("selectedImageData: " + selectedImageData);
      }

      if (isSelecting) {
        selectionRect.endX = event.clientX - canvas.offsetLeft;
        selectionRect.endY = event.clientY - canvas.offsetTop;
      }
      isSelecting = false;
      drawWithTransformations();
    } else if (isCopyMode && isDragging) {
      isDragging = false;
      isSelected = false;

      if (!isCopyMode) {
        // Clear the original selected area if it's Move Mode
        layers[currentLayerIndex].canvasCtx.clearRect(
          imgX,
          imgY,
          imgWidth,
          imgHeight
        );
      }

      isSelecting = false;
      selectedImageData = null;
      drawWithTransformations();
      saveState();
    } else if (isMoveMode && isDragging) {
      isDragging = false;
      isSelected = false;
      selectedImageData = null;
      saveState();
    } else {
      drawing = false;
      saveState();
    }
  });

  canvas.addEventListener("mousedown", function (e) {
    console.log("mousedown içinde isCopyMode: " + isCopyMode);
    console.log("mousedown içinde isSelecting: " + isSelecting);
    //Sürüklemek için
    if (zoomMode) {
      let startX = e.clientX;
      let startY = e.clientY;

      function onMouseMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panX += dx;
        panY += dy;

        startX = e.clientX;
        startY = e.clientY;

        drawWithTransformations();
      }

      function onMouseUp() {
        canvas.removeEventListener("mousemove", onMouseMove);
        canvas.removeEventListener("mouseup", onMouseUp);
      }

      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseup", onMouseUp);
    } else if (isCopyMode && !e.shiftKey) {
      if (!isSelected) {
        // Starting a new selection
        isSelecting = false;
        drawWithTransformations();
        isSelecting = true;
        selectionRect.startX = e.clientX - canvas.offsetLeft;
        selectionRect.startY = e.clientY - canvas.offsetTop;
      } else {
        // Starting to move the selected area
        isSelecting = false;
        canvasBuffer = layers[currentLayerIndex].canvasCtx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        isDragging = true;
        lastPos.x = e.clientX - canvas.offsetLeft;
        lastPos.y = e.clientY - canvas.offsetTop;
        drawWithTransformations();
      }
    } else if (isMoveMode && !e.shiftKey) {
      if (isSelected) {
        // If an area is already selected and we are about to move it
        isDragging = true;
        lastPos.x = e.clientX - canvas.offsetLeft;
        lastPos.y = e.clientY - canvas.offsetTop;

        // Clear the selected region and store the rest
        layers[currentLayerIndex].canvasCtx.clearRect(
          imgX,
          imgY,
          imgWidth,
          imgHeight
        );

        canvasBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height);

        drawWithTransformations();
      } else {
        // Starting a new selection
        isSelecting = true;
        selectionRect.startX = e.clientX - canvas.offsetLeft;
        selectionRect.startY = e.clientY - canvas.offsetTop;
      }
    } else {
      drawing = true;
    }
  });

  document.getElementById("eraser").onclick = function () {
    activateEraser();
  };

  document.getElementById("brush-btn").onclick = function () {
    deactivateEraser();
    unclick("zoomin");
    zoomMode = false;
    isCopyMode = false;
    isSelecting = false;
    click("brush-btn");
  };

  document.getElementById("zoomin").onclick = function () {
    //toggle zoomin button
    zoomMode = !zoomMode;
    deactivateEraser();
    click("zoomin");
    unclick("brush-btn");
    isCopyMode = false;
    isSelecting = false;
    if (!zoomMode) {
      unclick("zoomin");
    }
  };

  function activateEraser() {
    zoomMode = false;
    click("eraser");
    unclick("brush-btn");
    unclick("zoomin");
    isCopyMode = false;
    eraserModeOn = true;
    isSelecting = false;
  }

  function deactivateEraser() {
    unclick("eraser");
    eraserModeOn = false;
  }
  function drawSquare(i, j, targetCtx) {
    const x = i * squareSize;
    const y = j * squareSize;
    const cX = x + squareSize / 2;
    const cY = y + squareSize / 2;

    // Example: Drawing outlines of triangles
    targetCtx.beginPath();
    targetCtx.moveTo(cX, cY);
    targetCtx.lineTo(x, y + squareSize);
    targetCtx.lineTo(x + squareSize, y + squareSize);
    targetCtx.closePath();
    targetCtx.stroke();

    targetCtx.beginPath();
    targetCtx.moveTo(cX, cY);
    targetCtx.lineTo(x + squareSize, y + squareSize);
    targetCtx.lineTo(x + squareSize, y);
    targetCtx.closePath();
    targetCtx.stroke();

    targetCtx.beginPath();
    targetCtx.moveTo(cX, cY);
    targetCtx.lineTo(x + squareSize, y);
    targetCtx.lineTo(x, y);
    targetCtx.closePath();
    targetCtx.stroke();

    targetCtx.beginPath();
    targetCtx.moveTo(cX, cY);
    targetCtx.lineTo(x, y);
    targetCtx.lineTo(x, y + squareSize);
    targetCtx.closePath();
    targetCtx.stroke();
  }

  function drawTriangle(i, j, position, color, z) {
    const layer = layers.find((layer) => layer.z === z);
    if (!layer) return;

    const x = i * squareSize;
    const y = j * squareSize;
    const halfSize = squareSize / 2;

    const targetCtx = layer.canvasCtx;

    if (eraserModeOn) {
      const index = layer.triangles.findIndex(
        (triangle) =>
          triangle.i === i &&
          triangle.j === j &&
          triangle.position === position &&
          triangle.color === color
      );

      if (index !== -1) {
        layer.triangles.splice(index, 1);
      }

      // Clear that triangle on the canvas
      targetCtx.globalCompositeOperation = "destination-out";
      targetCtx.fillStyle = "rgba(255,255,255,1)"; // using white to erase (with dest-out it becomes transparent)
    } else {
      console.log("currentLayerIndex:", currentLayerIndex);
      console.log("layers:", layers);

      const triangle = { i, j, position, targetCtx, preferredColor, z };
      layer.triangles.push(triangle); // Add to current layer
      triangles.push({
        i,
        j,
        position,
        targetCtx,
        color: color || preferredColor,
      });
      targetCtx.fillStyle = color || preferredColor;
    }

    targetCtx.beginPath();
    switch (position) {
      case "top":
        targetCtx.moveTo(x, y);
        targetCtx.lineTo(x + squareSize, y);
        targetCtx.lineTo(x + halfSize, y + halfSize);
        break;
      case "right":
        targetCtx.moveTo(x + squareSize, y);
        targetCtx.lineTo(x + squareSize, y + squareSize);
        targetCtx.lineTo(x + halfSize, y + halfSize);
        break;
      case "bottom":
        targetCtx.moveTo(x, y + squareSize);
        targetCtx.lineTo(x + squareSize, y + squareSize);
        targetCtx.lineTo(x + halfSize, y + halfSize);
        break;
      case "left":
        targetCtx.moveTo(x, y);
        targetCtx.lineTo(x, y + squareSize);
        targetCtx.lineTo(x + halfSize, y + halfSize);
        break;
    }
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.globalCompositeOperation = "source-over"; // Reset
  }

  // After each draw operation, ensure to update the visible canvas
  function afterDrawing() {
    drawWithTransformations();
  }

  document.getElementById("cBtn0").onclick = function () {
    drawing = true;
    deactivateEraser();
    unclick("zoomin");
    changeColor("#00FF00");
    click("brush-btn");
    isCopyMode = false;
    isSelecting = false;
    zoomMode = false;
  };

  document.getElementById("cBtn1").onclick = function () {
    drawing = true;
    deactivateEraser();
    changeColor("red");
    unclick("zoomin");
    click("brush-btn");
    isCopyMode = false;
    isSelecting = false;
    zoomMode = false;
  };

  document.getElementById("cBtn2").onclick = function () {
    drawing = true;
    deactivateEraser();
    unclick("zoomin");
    zoomMode = false;
    click("brush-btn");
    isCopyMode = false;
    isSelecting = false;
    changeColor("yellow");
  };

  document.getElementById("cBtn3").onclick = function () {
    drawing = true;
    deactivateEraser();
    unclick("zoomin");
    click("brush-btn");
    isCopyMode = false;
    isSelecting = false;
    zoomMode = false;

    changeColor("black");
  };

  document.getElementById("cBtn4").onclick = function () {
    drawing = true;
    deactivateEraser();
    unclick("zoomin");
    click("brush-btn");
    zoomMode = false;
    isCopyMode = false;
    isSelecting = false;
    changeColor("orange");
  };

  document.getElementById("cBtn5").onclick = function () {
    drawing = true;
    deactivateEraser();
    click("brush-btn");
    unclick("zoomin");
    zoomMode = false;
    isCopyMode = false;
    isSelecting = false;
    changeColor("pink");
  };

  document.getElementById("cBtn6").onclick = function () {
    drawing = true;
    deactivateEraser();
    unclick("zoomin");
    click("brush-btn");
    isCopyMode = false;
    isSelecting = false;
    zoomMode = false;
    changeColor("cyan");
  };

  document.getElementById("cBtn7").onclick = function () {
    drawing = true;
    deactivateEraser();
    unclick("zoomin");
    click("brush-btn");
    isCopyMode = false;
    zoomMode = false;
    changeColor("magenta");
  };

  document.getElementById("lay1").onchange = function () {
    var rds = document.querySelectorAll('input[name="rad"]');
    for (var i = 0; i < 3; i++) {
      if (rds[i].checked == true) {
        currentLayerIndex = rds[i].value - 1;
        break;
      }
    }
    console.log("currentLayerIndex select: " + currentLayerIndex);
  };

  document.getElementById("lay2").onchange = function () {
    var rds = document.querySelectorAll('input[name="rad"]');
    for (var i = 0; i < 3; i++) {
      if (rds[i].checked == true) {
        currentLayerIndex = rds[i].value - 1;
        break;
      }
    }
    console.log("currentLayerIndex select: " + currentLayerIndex);
  };
  document.getElementById("lay3").onchange = function () {
    var rds = document.querySelectorAll('input[name="rad"]');
    for (var i = 0; i < 3; i++) {
      if (rds[i].checked == true) {
        currentLayerIndex = rds[i].value - 1;
        break;
      }
    }
    console.log("currentLayerIndex select: " + currentLayerIndex);
  };
  function moveLayer(direction) {
    const layerDiv = document.querySelector(".layer-div");
    const selectedLayer = document.querySelector('input[name="rad"]:checked');
    const selectedLayerLabel = selectedLayer.closest(".rad-label");

    if (direction === "above" && selectedLayerLabel.previousElementSibling) {
      layerDiv.insertBefore(
        selectedLayerLabel,
        selectedLayerLabel.previousElementSibling
      );
    } else if (direction === "below" && selectedLayerLabel.nextElementSibling) {
      layerDiv.insertBefore(
        selectedLayerLabel.nextElementSibling,
        selectedLayerLabel
      );
    }
  }

  document.getElementById("aboveBtn").onclick = function () {
    const tempZ = layers[currentLayerIndex].z;
    layers[currentLayerIndex].z = layers[currentLayerIndex - 1].z;
    layers[currentLayerIndex - 1].z = tempZ;
    if (currentLayerIndex > 0) {
      const temp = layers[currentLayerIndex];
      layers[currentLayerIndex] = layers[currentLayerIndex - 1];
      layers[currentLayerIndex - 1] = temp;
      currentLayerIndex--;

      moveLayer("above");
    }
    drawWithTransformations(); // Assuming this function redraws everything on the canvas based on layers
  };

  document.getElementById("belowBtn").onclick = function () {
    const tempZ = layers[currentLayerIndex].z;
    layers[currentLayerIndex].z = layers[currentLayerIndex - 1].z;
    layers[currentLayerIndex - 1].z = tempZ;
    if (currentLayerIndex < layers.length - 1) {
      const temp = layers[currentLayerIndex];
      layers[currentLayerIndex] = layers[currentLayerIndex + 1];
      layers[currentLayerIndex + 1] = temp;
      currentLayerIndex++;

      moveLayer("below");
    }
    drawWithTransformations(); // Assuming this function redraws everything on the canvas based on layers
  };

  function renderCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sortedLayers = layers.sort((a, b) => a.z - b.z);
    for (let layer of sortedLayers) {
      ctx.drawImage(layer.canvas, 0, 0);
    }
  }

  document.getElementById("saveBtn").onclick = function () {
    const blob = new Blob([JSON.stringify(triangles)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "saved.txt";
    a.click("brush-btn");

    URL.revokeObjectURL(url);
  };
  fileBtn.addEventListener("change", function () {
    if (fileBtn.value) {
      uploadTxt.innerHTML = fileBtn.value.match(
        /[\/\\]([\w\d\s\.\-\(\)]+)$/
      )[1];
    } else {
      uploadTxt.innerHTML = "No file chosen, yet!";
    }
  });

  document.getElementById("selectBtn").onclick = function () {
    fileBtn.click("brush-btn");
    // document.getElementById("up-file").click();  // Trigger file input's click
  };

  document
    .getElementById("up-file")
    .addEventListener("change", function (event) {
      const currentLayerZ = layers[currentLayerIndex].z;
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        const loadedTriangles = JSON.parse(event.target.result);

        console.log(loadedTriangles);

        // Clear your triangles array and canvas here if necessary
        triangles.length = 0;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        layers[currentLayerIndex].canvasCtx.clearRect(
          0,
          0,
          layers[currentLayerIndex].canvasCtx.canvas.width,
          layers[currentLayerIndex].canvasCtx.canvas.height
        );

        // Redraw the triangles
        for (const triangle of loadedTriangles) {
          drawTriangle(
            triangle.i,
            triangle.j,
            triangle.position,
            triangle.color,
            currentLayerZ
          );
          drawTriangle(
            triangle.i,
            triangle.j,
            triangle.position,
            triangle.color,
            currentLayerZ
          );

          triangles.push(triangle);
        }
      };
      reader.readAsText(file);
    });
  function unclick(id) {
    var element = document.getElementById(id);
    element.classList.remove("clicked");
    element.classList.add("button");
  }
  function click(id) {
    var element = document.getElementById(id);
    element.classList.remove("button");
    element.classList.add("clicked");
  }

  function changeColor(color) {
    preferredColor = color;
  }
  function saveState() {
    if (currentStateIndex < states.length - 1) {
      states.splice(currentStateIndex + 1);
    }

    if (states.length >= maxStates) {
      states.shift();
    }

    states.push(canvas.toDataURL());
    currentStateIndex = states.length - 1;
  }

  function undo() {
    if (currentStateIndex <= 0) {
      alert("Cannot undo more!");
      return;
    }
    currentStateIndex--;
    loadState();
  }

  function redo() {
    if (currentStateIndex >= states.length - 1) {
      alert("Cannot redo more!");
      return;
    }
    currentStateIndex++;
    loadState();
  }

  function loadState() {
    const imgData = states[currentStateIndex];
    const img = new Image();
    img.src = imgData;
    img.onload = () => {
      layers[currentLayerIndex].canvasCtx.clearRect(
        0,
        0,
        buffer.width,
        buffer.height
      );
      layers[currentLayerIndex].canvasCtx.drawImage(img, 0, 0);
      drawWithTransformations(); // Ensure to reflect changes on the main canvas
    };
  }
  function findLayerLoc(crt) {
    for (var i = 0; i < 3; i++) {
      if (layers[i] == crt) return i;
    }
    return -1;
  }

  // Event listeners for buttons
  document.getElementById("undo").addEventListener("click", undo);
  document.getElementById("redo").addEventListener("click", redo);

  saveState(); // Save the initial state (blank canvas)
});
