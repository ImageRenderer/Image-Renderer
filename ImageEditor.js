var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d', { willReadFrequently: true });
var zDepthImages = [];
var albedoImages = [];
var zDepthFiles = []
var albedoFiles = []
var imageIndex = 0
var zDepthPixels = null

// Add event listeners to the file input elements
document.getElementById('z-depth-input').addEventListener('change', function (event) {
    var imagesLoaded = 0
    zDepthFiles = event.target.files;
    for (var i = 0; i < zDepthFiles.length; i++) {
        var file = zDepthFiles[i];
        var image = new Image();
        image.onload = function () {
            imagesLoaded++
            if (imagesLoaded == zDepthFiles.length) {
                updateCanvas()
                renderPreview();
                document.getElementById('render-button').disabled = (zDepthImages.length == 0 || albedoImages.length == 0);
                document.getElementById('move-left').disabled = (zDepthImages.length == 0 || albedoImages.length == 0);
                document.getElementById('move-right').disabled = (zDepthImages.length == 0 || albedoImages.length == 0);
            }
        }
        image.src = URL.createObjectURL(file);
        zDepthImages.push(image);
    }
});

document.getElementById('albedo-input').addEventListener('change', function (event) {
    var imagesLoaded = 0
    albedoFiles = event.target.files;
    for (var i = 0; i < albedoFiles.length; i++) {
        var file = albedoFiles[i];
        var image = new Image();
        image.onload = function () {
            imagesLoaded++;
            if (imagesLoaded == albedoFiles.length) {
                updateCanvas()
                renderPreview();
                document.getElementById('render-button').disabled = (zDepthImages.length == 0 || albedoImages.length == 0);
                document.getElementById('move-left').disabled = (zDepthImages.length == 0 || albedoImages.length == 0);
                document.getElementById('move-right').disabled = (zDepthImages.length == 0 || albedoImages.length == 0);
            }
        };
        image.src = URL.createObjectURL(file);
        albedoImages.push(image);
    }
});

document.getElementById('depth-slider').onmouseup = function () { renderPreview() }
document.getElementById('intensity-slider').onmouseup = function () { renderPreview() }
document.getElementById('contrast-slider').onmouseup = function () { renderPreview() }
document.getElementById('gamma-slider').onmouseup = function () { renderPreview() }

document.getElementById('reset-depth').onclick = function() {
    resetSlider('depth-slider', 0);
};
document.getElementById('reset-intensity').onclick = function() {
    resetSlider('intensity-slider', 0);
};
document.getElementById('reset-contrast').onclick = function() {
    resetSlider('contrast-slider', 0);
};
document.getElementById('reset-gamma').onclick = function() {
    resetSlider('gamma-slider', 1);
};

document.getElementById('move-left').addEventListener('click', moveLeft);
document.getElementById('move-right').addEventListener('click', moveRight);
document.getElementById('render-button').addEventListener('click', render);

function updateCanvas() {
    if (zDepthImages.length > imageIndex && albedoImages.length > imageIndex && imageIndex >= 0) {
        var zDepthImage = zDepthImages[imageIndex];
        var albedoImage = albedoImages[imageIndex];
        var width = zDepthImage.width;
        var height = zDepthImage.height;

        canvas.width = width;
        canvas.height = height;

        context.drawImage(albedoImage, 0, 0, width, height);

        var zDepthCanvas = document.createElement('canvas');
        zDepthCanvas.width = width;
        zDepthCanvas.height = height;
        var zDepthContext = zDepthCanvas.getContext('2d');
        zDepthContext.drawImage(zDepthImage, 0, 0);
        var zDepthImageData = zDepthContext.getImageData(0, 0, width, height);
        zDepthPixels = zDepthImageData.data;
    }
}

function renderPreview() {
    var zDepthValue = parseFloat(document.getElementById('depth-slider').value);
    var intensityValue = parseFloat(document.getElementById('intensity-slider').value);
    var contrastValue = parseFloat(document.getElementById('contrast-slider').value);
    var gammaValue = parseFloat(document.getElementById('gamma-slider').value);

    if (zDepthImages.length > imageIndex && albedoImages.length > imageIndex && imageIndex >= 0 && zDepthPixels != null) {
        var zDepthImage = zDepthImages[imageIndex];
        var albedoImage = albedoImages[imageIndex];
        var width = zDepthImage.width;
        var height = zDepthImage.height;

        canvas.width = width;
        canvas.height = height;

        context.drawImage(albedoImage, 0, 0, width, height);

        var imageData = context.getImageData(0, 0, width, height);
        var data = imageData.data

        for (var i = 0; i < data.length; i += 4) {
            var zDepth = zDepthPixels[i] / 255.0;

            var fogIntensity = (1 - intensityValue) * 255;
            var fogDensity = 1 - Math.pow(1 - zDepth, zDepthValue);

            var finalR = data[i] * (1 - fogDensity) + fogIntensity * fogDensity;
            var finalG = data[i + 1] * (1 - fogDensity) + fogIntensity * fogDensity;
            var finalB = data[i + 2] * (1 - fogDensity) + fogIntensity * fogDensity;

            var contrast = (contrastValue + 1) / (1 - contrastValue);
            finalR = (finalR - 128) * contrast + 128;
            finalG = (finalG - 128) * contrast + 128;
            finalB = (finalB - 128) * contrast + 128;

            if (zDepthValue > 0) {
                var gamma = 1 / gammaValue;
                finalR = Math.pow(finalR / 255, gamma) * 255;
                finalG = Math.pow(finalG / 255, gamma) * 255;
                finalB = Math.pow(finalB / 255, gamma) * 255;
            }

            data[i] = finalR;
            data[i + 1] = finalG;
            data[i + 2] = finalB;
        }
        context.putImageData(imageData, 0, 0);
    }
}

function moveLeft() {
    if (imageIndex > 0) {
        imageIndex--;
    } else {
        imageIndex = albedoFiles.length - 1;
    }
    updateCanvas()
    renderPreview();

}

function moveRight() {
    if (imageIndex < albedoFiles.length - 1) {
        imageIndex++;
    } else {
        imageIndex = 0; 
    }
    updateCanvas()
    renderPreview()
}

function render() {
    const zip = new JSZip();
    //sets image to first one
    imageIndex = 0;
    updateCanvas();
    renderPreview();
    for (var i = 0; i < zDepthFiles.length; i++) {
        const canvasImage = document.getElementById('canvas').toDataURL()

        const data = atob(canvasImage.split(',')[1]);
        const array = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            array[i] = data.charCodeAt(i);
        }
        const blob = new Blob([array], { type: 'image/png' });

        zip.file("frame_" + i + ".png", blob);
        moveRight();
    }
    zip.generateAsync({ type: "blob" }).then(function (content) {
        const zipBlobUrl = URL.createObjectURL(content);

        const a = document.createElement("a");
        a.href = zipBlobUrl;
        a.download = "frames.zip";
        a.click();
    });
}

function resetSlider(slider, resetValue) {
    document.getElementById(slider).value = resetValue;
    renderPreview();
}

function toggleRealTimeRendering() {
    var checkBox = document.getElementById('real-time-rendering-toggle');

    if(checkBox.checked) {
        document.getElementById('depth-slider').addEventListener('input', renderPreview);
        document.getElementById('intensity-slider').addEventListener('input', renderPreview);
        document.getElementById('contrast-slider').addEventListener('input', renderPreview);
        document.getElementById('gamma-slider').addEventListener('input', renderPreview);
    } else {
        document.getElementById('depth-slider').removeEventListener('input', renderPreview);
        document.getElementById('intensity-slider').removeEventListener('input', renderPreview);
        document.getElementById('contrast-slider').removeEventListener('input', renderPreview);
        document.getElementById('gamma-slider').removeEventListener('input', renderPreview);
    }

}




