document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");

  var preferredColor = "black";
  var eraserModeOn = false;
  const canvas = document.getElementById("gl-canvas");
  const ctx = canvas.getContext("2d");

  let buffer = document.createElement("canvas");
  let bufferCtx = buffer.getContext("2d");

  buffer.width = canvas.width;
  buffer.height = canvas.height;

  let panX = 0;
  let panY = 0;
  let zoom = 1;
  let zoomMode = false;

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

  let isMoveMode = false;
  let startX, startY;
  let selectedImageData = null;
  let imgX, imgY, imgWidth, imgHeight;

  document.getElementById("moveBtn").addEventListener("click", () => {
    isMoveMode = !isMoveMode;
    if (isMoveMode) {
      canvas.style.cursor = "move";
      unclick("brush-btn");
      unclick("zoomin");
      deactivateEraser();
    } else {
      canvas.style.cursor = "default";
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (isMoveMode && selectedImageData) {
      const x = event.clientX - canvas.getBoundingClientRect().left;
      const y = event.clientY - canvas.getBoundingClientRect().top;

      bufferCtx.clearRect(imgX, imgY, imgWidth, imgHeight); // Clear the previous drawn image
      // Draw other elements, like grid, etc.
      // drawGrid();

      bufferCtx.putImageData(selectedImageData, x, y); // Draw at the new position
      imgX = x;
      imgY = y;
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
    //çizmek için
    if (drawing) {
      const pos = getTransformedMousePos(canvas, e);
      const i = Math.floor(pos.x / squareSize);
      const j = Math.floor(pos.y / squareSize);
      const relX = pos.x - i * squareSize;
      const relY = pos.y - j * squareSize;

      // Determine which triangle to fill
      if (relX > relY) {
        if (squareSize - relX > relY) drawTriangle(i, j, "top", bufferCtx);
        else drawTriangle(i, j, "right", bufferCtx);
      } else {
        if (squareSize - relX > relY) drawTriangle(i, j, "left", bufferCtx);
        else drawTriangle(i, j, "bottom", bufferCtx);
      }
      afterDrawing();
    }
  });

  function updateBufferAndDraw() {
    bufferCtx.clearRect(0, 0, buffer.width, buffer.height);

    // Update your offscreen canvas as needed here. E.g., draw the grid, shapes, etc.
    drawGrid();

    // Draw the updated buffer on the main canvas
    drawWithTransformations();
  }

  function drawWithTransformations() {
    ctx.save(); // Save the current state
    //saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.translate(panX, panY); // Move the canvas
    ctx.scale(zoom, zoom); // Zoom in/out
    // All your drawing code comes here...
    //drawGrid(); // Assuming this function draws your static grid

    // Draw all triangles
    // triangles.forEach(({ i, j, position, color }) => {
    //   preferredColor = color; // Set the color for each triangle
    //   drawTriangle(i, j, position); // Redraw each triangle
    // });

    ctx.drawImage(buffer, 0, 0);

    ctx.restore(); // Restore the original state
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
    if (isMoveMode && selectedImageData) {
      const endX = event.clientX - canvas.getBoundingClientRect().left;
      const endY = event.clientY - canvas.getBoundingClientRect().top;
      imgX = endX;
      imgY = endY;
    }
    drawing = false;
    saveState();
  });
  canvas.addEventListener("mousedown", function (e) {
    //Sürüklemek için
    if (isMoveMode) {
      startX = e.clientX - canvas.getBoundingClientRect().left;
      startY = e.clientY - canvas.getBoundingClientRect().top;
    } else if (zoomMode) {
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
    } else {
      drawing = true;
    }
  });

  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    };
  }

  function drawGrid() {
    for (let i = 0; i < numSquares; i++) {
      for (let j = 0; j < numSquares; j++) {
        drawSquare(i, j, bufferCtx);
      }
    }
  }
  document.getElementById("eraser").onclick = function () {
    activateEraser();
  };

  document.getElementById("brush-btn").onclick = function () {
    deactivateEraser();
    unclick("zoomin");
    zoomMode = false;
    isMoveMode = false;
    click("brush-btn");
  };

  document.getElementById("zoomin").onclick = function () {
    //toggle zoomin button
    zoomMode = !zoomMode;
    deactivateEraser();
    click("zoomin");
    unclick("brush-btn");
    isMoveMode = false;
    if (!zoomMode) {
      unclick("zoomin");
    }
  };

  function activateEraser() {
    zoomMode = false;
    click("eraser");
    unclick("brush-btn");
    unclick("zoomin");
    isMoveMode = false;
    eraserModeOn = true;
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

  function drawTriangle(i, j, position, targetCtx) {
    triangles.push({ i, j, position, color: preferredColor });
    const x = i * squareSize;
    const y = j * squareSize;
    const halfSize = squareSize / 2;

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
    if (eraserModeOn) {
      targetCtx.globalCompositeOperation = "destination-out";
      targetCtx.fillStyle = "rgba(255,255,255,1)"; // using white to erase (with dest-out it becomes transparent)
      targetCtx.fill();
      targetCtx.globalCompositeOperation = "source-over"; // Reset
    } else {
      targetCtx.fillStyle = preferredColor;
      targetCtx.fill();
      //targetCtx.stroke();
    }
  }

  // After each draw operation, ensure to update the visible canvas
  function afterDrawing() {
    drawWithTransformations();
  }
  document.getElementById("cBtn0").onclick = function () {
    deactivateEraser();
    unclick("zoomin");
    changeColor("#00FF00");
    click("brush-btn");

    zoomMode = false;

  };

  document.getElementById("cBtn1").onclick = function () {
    deactivateEraser();
    changeColor("red");
    unclick("zoomin");
    click("brush-btn");

    zoomMode = false;


  };

  document.getElementById("cBtn2").onclick = function () {
    deactivateEraser();
    unclick("zoomin");
    zoomMode = false;
    click("brush-btn");

    changeColor("yellow");
  };

  document.getElementById("cBtn3").onclick = function () {
    deactivateEraser();
    unclick("zoomin");
    click("brush-btn");

    zoomMode = false;

    changeColor("black");
  };

  document.getElementById("cBtn4").onclick = function () {
    deactivateEraser();
    unclick("zoomin");
    click("brush-btn");
    zoomMode = false;

    changeColor("orange");
  };

  document.getElementById("cBtn5").onclick = function () {
    deactivateEraser();
    click("brush-btn");
    unclick("zoomin");
    zoomMode = false;

    changeColor("pink");
  };

  document.getElementById("cBtn6").onclick = function () {
    deactivateEraser();
    unclick("zoomin");
    click("brush-btn");

zoomMode = false;
    changeColor("cyan");
  };

  document.getElementById("cBtn7").onclick = function () {
    deactivateEraser();
    unclick("zoomin");
    click("brush-btn");

    zoomMode = false;
    changeColor("magenta");
  };

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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }

  // Event listeners for buttons
  document.getElementById("undo").addEventListener("click", undo);
  document.getElementById("redo").addEventListener("click", redo);

  saveState(); // Save the initial state (blank canvas)
});
