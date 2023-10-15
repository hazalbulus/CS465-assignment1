document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");

  var preferredColor = "black";
  var eraserModeOn = false;
  const canvas = document.getElementById("gl-canvas");
  const ctx = canvas.getContext("2d");

  let panX = 0;
  let panY = 0;
  let zoom = 1;

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

  // Draw the initial grid

  // Event Listeners
  canvas.addEventListener("mousedown", () => {
    drawing = true;
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
    saveState();
    drawWithTransformations();
  });

  function getTransformedMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left - panX) / zoom,
      y: (evt.clientY - rect.top - panY) / zoom,
    };
  }

  canvas.addEventListener("mousemove", function (e) { //çizmek için
    if (drawing) {
      const pos = getTransformedMousePos(canvas, e);
      const i = Math.floor(pos.x / squareSize);
      const j = Math.floor(pos.y / squareSize);
      const relX = pos.x - i * squareSize;
      const relY = pos.y - j * squareSize;

      // Determine which triangle to fill
      if (relX > relY) {
        if (squareSize - relX > relY) drawTriangle(i, j, "top");
        else drawTriangle(i, j, "right");
      } else {
        if (squareSize - relX > relY) drawTriangle(i, j, "left");
        else drawTriangle(i, j, "bottom");
      }
    }
  });

  function drawWithTransformations() {
    ctx.save(); // Save the current state
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.translate(panX, panY); // Move the canvas
    ctx.scale(zoom, zoom); // Zoom in/out

    // All your drawing code comes here...
    drawGrid(); // Assuming this function draws your static grid

    // ... any other drawing logic, but NOT event listeners ...

    ctx.restore(); // Restore the original state
  }

  canvas.addEventListener( //Yakınlaştırmak için
    "wheel",
    function (e) {
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

  canvas.addEventListener("mousedown", function (e) { //Sürüklemek için
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
        drawSquare(i, j);
      }
    }
  }
  document.getElementById("eraser").onclick = function () {
    activateEraser();
  };

  document.getElementById("brush-btn").onclick = function () {
    deactivateEraser();
  };

  function activateEraser() {
    click("eraser");
    unclick("brush-btn");
    eraserModeOn = true;
  }

  function deactivateEraser() {
    click("brush-btn");
    unclick("eraser");
    eraserModeOn = false;
  }
  function drawSquare(i, j) {
    const x = i * squareSize;
    const y = j * squareSize;
    const cX = x + squareSize / 2;
    const cY = y + squareSize / 2;

    // Example: Drawing outlines of triangles
    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(x, y + squareSize);
    ctx.lineTo(x + squareSize, y + squareSize);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(x + squareSize, y + squareSize);
    ctx.lineTo(x + squareSize, y);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(x + squareSize, y);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + squareSize);
    ctx.closePath();
    ctx.stroke();
  }

  function drawTriangle(i, j, position) {
    const x = i * squareSize;
    const y = j * squareSize;
    const halfSize = squareSize / 2;

    ctx.beginPath();
    switch (position) {
      case "top":
        ctx.moveTo(x, y);
        ctx.lineTo(x + squareSize, y);
        ctx.lineTo(x + halfSize, y + halfSize);
        break;
      case "right":
        ctx.moveTo(x + squareSize, y);
        ctx.lineTo(x + squareSize, y + squareSize);
        ctx.lineTo(x + halfSize, y + halfSize);
        break;
      case "bottom":
        ctx.moveTo(x, y + squareSize);
        ctx.lineTo(x + squareSize, y + squareSize);
        ctx.lineTo(x + halfSize, y + halfSize);
        break;
      case "left":
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + squareSize);
        ctx.lineTo(x + halfSize, y + halfSize);
        break;
    }
    ctx.closePath();
    if (eraserModeOn) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(255,255,255,1)"; // using white to erase (with dest-out it becomes transparent)
      ctx.fill();
      ctx.globalCompositeOperation = "source-over"; // Reset
    } else {
      ctx.fillStyle = preferredColor;
      ctx.fill();
      //ctx.stroke();
    }
  }
  document.getElementById("cBtn0").onclick = function () {
    deactivateEraser();
    changeColor("#00FF00");
  };

  document.getElementById("cBtn1").onclick = function () {
    deactivateEraser();
    changeColor("red");
  };

  document.getElementById("cBtn2").onclick = function () {
    deactivateEraser();
    changeColor("yellow");
  };

  document.getElementById("cBtn3").onclick = function () {
    deactivateEraser();
    changeColor("black");
  };

  document.getElementById("cBtn4").onclick = function () {
    deactivateEraser();
    changeColor("orange");
  };

  document.getElementById("cBtn5").onclick = function () {
    deactivateEraser();
    changeColor("pink");
  };

  document.getElementById("cBtn6").onclick = function () {
    deactivateEraser();
    changeColor("cyan");
  };

  document.getElementById("cBtn7").onclick = function () {
    deactivateEraser();
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
