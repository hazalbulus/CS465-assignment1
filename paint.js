document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded");
    
    const canvas = document.getElementById("gl-canvas");
    if (!canvas.getContext) {
        alert("Your browser does not support canvas!");
        return;
    }
    const ctx = canvas.getContext('2d');
    console.log("Context obtained", ctx);

    let drawing = false;

    canvas.addEventListener('mousedown', () => {
        console.log("Mousedown event");
        drawing = true;
    });

    canvas.addEventListener('mouseup', () => {
        console.log("Mouseup event");
        drawing = false;
        ctx.beginPath(); 
    });

    canvas.addEventListener('mousemove', draw);

    function draw(e) {
        console.log("Mousemove event");
        if (!drawing) return;

        ctx.lineWidth = 5;
        ctx.strokeStyle = 'black';
        
        const { offsetX, offsetY } = e;

        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    }
});
