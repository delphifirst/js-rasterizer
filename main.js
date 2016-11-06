var debug = false;
var debugPixelSize = 20;
var framebuffer;
var width;
var height;

function drawLine(framebuffer, x1, y1, x2, y2)
{

}

function drawScene(deltaTime)
{
	for(var i = 0; i < height; ++i)
		for(var j = 0; j < width; ++j)
		{
			var pixelStartIndex = i * width * 4 + j * 4;
			framebuffer[pixelStartIndex] = (j * 10 % 256) / 255.0;
		}
}

function render(deltaTime)
{
	drawScene(deltaTime);

	var canvas = document.getElementById("raster-canvas");
	var context = canvas.getContext("2d");

	if(debug)
	{
		for(var i = 0; i < height; ++i)
			for(var j = 0; j < width; ++j)
			{
				var pixelStartIndex = i * width * 4 + j * 4;
				r = Math.floor(255 * framebuffer[pixelStartIndex]);
				g = Math.floor(255 * framebuffer[pixelStartIndex + 1]);
				b = Math.floor(255 * framebuffer[pixelStartIndex + 2]);
				context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
				context.fillRect(j * debugPixelSize, i * debugPixelSize, debugPixelSize, debugPixelSize);
			}

		context.beginPath();
		context.lineWidth = 2;
		context.strokeStyle = "rgb(0, 128, 255)";
		for(var i = 0; i <= height; ++i)
		{
			context.moveTo(0, i * debugPixelSize);
			context.lineTo(width * debugPixelSize, i * debugPixelSize);
		}
		for(var i = 0; i <= width; ++i)
		{
			context.moveTo(i * debugPixelSize, 0);
			context.lineTo(i * debugPixelSize, height * debugPixelSize);
		}
		context.stroke();
		context.beginPath();
		context.strokeStyle = "rgb(255, 0, 0)";
		context.moveTo(0, height / 2 * debugPixelSize);
		context.lineTo(width * debugPixelSize, height / 2 * debugPixelSize);
		context.moveTo(width / 2 * debugPixelSize, 0);
		context.lineTo(width / 2 * debugPixelSize, height * debugPixelSize);
		context.stroke();
	}
	else
	{
		var canvasWidth = canvas.attributes.width.value;
		var canvasHeight = canvas.attributes.height.value;
		var imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
		var data = imageData.data;

		for(var i = 0; i < height; ++i)
			for(var j = 0; j < width; ++j)
			{
				var pixelStartIndex = i * width * 4 + j * 4;
				data[pixelStartIndex] = 255 * framebuffer[pixelStartIndex];
				data[pixelStartIndex + 1] = 255 * framebuffer[pixelStartIndex + 1];
				data[pixelStartIndex + 2] = 255 * framebuffer[pixelStartIndex + 2];
				data[pixelStartIndex + 3] = 255;
			}
		context.putImageData(imageData, 0, 0);
	}
}

function initFramebuffer()
{
	var canvas = document.getElementById("raster-canvas");
	var canvasWidth = canvas.attributes.width.value;
	var canvasHeight = canvas.attributes.height.value;
	if(debug)
	{
		width = Math.floor(canvasWidth / debugPixelSize);
		height = Math.floor(canvasHeight / debugPixelSize);
	}
	else
	{
		width = canvasWidth;
		height = canvasHeight;
	}
	framebuffer = new Float32Array(width * height * 4);
	for(var i = 0; i < framebuffer.length; ++i)
		framebuffer[i] = 0;
}

function init()
{
	initFramebuffer();
	var checkboxDebug = document.getElementById("checkbox-debug");
	checkboxDebug.checked = debug;
	var lastUpdateTime = (new Date).getTime();
	var lastUpdateFpsTime = lastUpdateTime;
	var frameCount = 0;
	setInterval(function(){
		var currentTime = (new Date).getTime();
		var deltaTime = currentTime - lastUpdateTime;
		lastUpdateTime = currentTime;
		if(currentTime - lastUpdateFpsTime > 1000)
		{
			var labelFps = document.getElementById("label-fps");
			labelFps.innerHTML = "FPS: " + frameCount;
			lastUpdateFpsTime = currentTime;
			frameCount = 0;
		}
		render(deltaTime);
		++frameCount;
	}, 1000 / 60);
}

function toggleDebug()
{
	var checkboxDebug = document.getElementById("checkbox-debug");
	debug = checkboxDebug.checked;
	var canvas = document.getElementById("raster-canvas");
	var context = canvas.getContext("2d");
	var canvasWidth = canvas.attributes.width.value;
	var canvasHeight = canvas.attributes.height.value;
	context.fillStyle = "rgb(255,255,255)";
	context.fillRect(0, 0, canvasWidth, canvasHeight);
	initFramebuffer();
}

function start()
{
	init();
}
