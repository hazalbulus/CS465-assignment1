document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");

  var preferredColor = 'black';

  const canvas = document.getElementById("gl-canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    alert("Your browser does not support canvas!");
    return;
  }

  console.log("Context obtained", ctx);

  let drawing = false;
  const numSquares = 60; // number of squares per row/column
  const squareSize = canvas.width / numSquares;

  // Draw the initial grid

  // Event Listeners
  canvas.addEventListener("mousedown", () => {
    drawing = true;
  });

  canvas.addEventListener("mouseup", () => {
    drawing = false;
  });

  canvas.addEventListener("mousemove", function (e) {
    if (drawing) {
      const pos = getMousePos(canvas, e);
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
    ctx.fillStyle = preferredColor;
    ctx.fill();
    ctx.stroke();
  }

  document.getElementById("cBtn0").onclick = function () {
    stopEraser();
    changeColor('#00FF00');
  };

  document.getElementById("cBtn1").onclick = function () {
    stopEraser();
    changeColor('red');
  };

  document.getElementById("cBtn2").onclick = function () {
    stopEraser();
    changeColor('yellow');
  };

  document.getElementById("cBtn3").onclick = function () {
    stopEraser();
    changeColor('black');
  };

  document.getElementById("cBtn4").onclick = function () {
    stopEraser();
    changeColor('orange');
  };

  document.getElementById("cBtn5").onclick = function () {
    stopEraser();
    changeColor('pink');
  };

  document.getElementById("cBtn6").onclick = function () {
    stopEraser();
    changeColor('cyan');
  };

  document.getElementById("cBtn7").onclick = function () {
    stopEraser();
    changeColor('magenta');
  };

  function stopEraser() {
    // eraserModeOn = false;
    // if (currentmode == modes[3]) {
    //   click("brush-btn");
    //   unclick("eraser");
    // }
  }

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
});
