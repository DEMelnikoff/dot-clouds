const jsPsych = initJsPsych();

const dots = function(c, signal, noise) {
    const canvasWidth = c.width;
    const canvasHeight = c.height;
    const ctx = c.getContext('2d');
    const xMinLeft = canvasWidth * .1;
    const xMaxLeft = canvasWidth * .4;
    const yMinLeft = (canvasHeight / 2) - (xMaxLeft - xMinLeft);
    const yMaxLeft = (canvasHeight / 2) + (xMaxLeft - xMinLeft);
    const xMinRight = canvasWidth * .6;
    const xMaxRight = canvasWidth * .9;
    const yMinRight = (canvasHeight / 2) - (xMaxRight - xMinRight);
    const yMaxRight = (canvasHeight / 2) + (xMaxRight - xMinRight);

    function drawCircle(ctx, x, y, radius, fill, stroke, strokeWidth) {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false)
        if (fill) {
            ctx.fillStyle = fill
            ctx.fill()
        }
        if (stroke) {
            ctx.lineWidth = strokeWidth
            ctx.strokeStyle = stroke
            ctx.stroke()
        }
    }

    function gaussianRandom(mean, stdev) {
        let x = -1;
        while(x < 1) {
            let u = 1 - Math.random(); // Converting [0,1) to (0,1]
            let v = Math.random();
            let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
            x = z * stdev + mean;
        }
        return x;
    }

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    function getYRange(min, max, x) {
        let rad = (max - min) / 2;
        let a = Math.abs(min + rad - x);
        let b = Math.sqrt(rad**2 - a**2);
        return range = [(canvasHeight/2) - b, (canvasHeight/2) + b];
    }

    const id = setInterval(() => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clean up
        let nLeft = gaussianRandom(30 - (signal/2), noise);
        let nRight = gaussianRandom(30 + (signal/2), noise);
        for(i = 1; i <= nLeft; i++) {
            let xPosLeft = getRandom(xMinLeft, xMaxLeft);
            let yRangeLeft = getYRange(xMinLeft, xMaxLeft, xPosLeft);
            let yPosLeft = getRandom(yRangeLeft[0], yRangeLeft[1]);
            drawCircle(ctx, xPosLeft, yPosLeft, 2, 'black', 'red', 2);
        }
        for(i = 1; i <= nRight; i++) {
            let xPosRight = getRandom(xMinRight, xMaxRight);
            let yRangeRight = getYRange(xMinRight, xMaxRight, xPosRight);
            let yPosRight = getRandom(yRangeRight[0], yRangeRight[1]);
            drawCircle(ctx, xPosRight, yPosRight, 2, 'black', 'red', 2);  
        }
    }, 150);
};