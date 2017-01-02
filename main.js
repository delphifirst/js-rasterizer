var debug = true;
var debugLine = true;
var debugPixelSize = 20;
var framebuffer;
var width;
var height;

var totalTime = 0;

var renderState = {
	vertexShader: undefined,
	viewportMatrix: undefined,
};

function clearFramebuffer()
{
	for(var i = 0; i < height; ++i)
		for(var j = 0; j < width; ++j)
		{
			var pixelStartIndex = i * width * 4 + j * 4;
			framebuffer[pixelStartIndex] = 0;
			framebuffer[pixelStartIndex + 1] = 0;
			framebuffer[pixelStartIndex + 2] = 0;
		}
}

function drawPixel(x, y, r, g, b)
{
	var i = Math.floor(height - y - 0.5);
	if(i >= 0 && i < height)
	{
		var j = Math.floor(x + 0.5);
		if(j >= 0 && j < width)
		{
			var pixelStartIndex = i * width * 4 + j * 4;
			framebuffer[pixelStartIndex] = r;
			framebuffer[pixelStartIndex + 1] = g;
			framebuffer[pixelStartIndex + 2] = b;
		}
	}
}

function drawLine(x0, y0, x1, y1, r, g, b)
{
	var i0 = Math.floor(height - y0 - 0.5);
	var i1 = Math.floor(height - y1 - 0.5);
	var j0 = Math.floor(x0 + 0.5);
	var j1 = Math.floor(x1 + 0.5);

	function swapPoint()
	{
		var temp = j0;
		j0 = j1;
		j1 = temp;
		temp = i0;
		i0 = i1;
		i1 = temp;
	}

	if(i0 === i1 && j0 === j1)
		drawPixel(x0, y0, r, g, b);
	else
	{
		if(Math.abs(j1 - j0) >= Math.abs(i1 - i0))
		{
			if(j0 > j1)
				swapPoint();
			var delta = (i1 - i0) / (j1 - j0);
			for(var i = i0, j = j0; j <= j1; i += delta, ++j)
			{
				if(i >= 0 && i < height && j >= 0 && j < width)
				{
					var pixelStartIndex = Math.round(i) * width * 4 + j * 4;
					framebuffer[pixelStartIndex] = r;
					framebuffer[pixelStartIndex + 1] = g;
					framebuffer[pixelStartIndex + 2] = b;
				}
			}
		}
		else
		{
			if(i0 > i1)
				swapPoint();
			var delta = (j1 - j0) / (i1 - i0);
			for(var i = i0, j = j0; i <= i1; ++i, j += delta)
			{
				if(i >= 0 && i < height && j >= 0 && j < width)
				{
					var pixelStartIndex = i * width * 4 + Math.round(j) * 4;
					framebuffer[pixelStartIndex] = r;
					framebuffer[pixelStartIndex + 1] = g;
					framebuffer[pixelStartIndex + 2] = b;
				}
			}
		}
	}
}

function draw(vertexBuffer)
{
	transformedVertexBuffer = renderState.vertexShader(renderState, vertexBuffer);
	for(var i = 0; i < transformedVertexBuffer.length; i += 3)
	{
		var v1 = transformedVertexBuffer.slice(i * 4, i * 4 + 4);
		var v2 = transformedVertexBuffer.slice((i + 1) * 4, (i + 1) * 4 + 4);
		var v3 = transformedVertexBuffer.slice((i + 2) * 4, (i + 2) * 4 + 4);
		drawLine(v1[0], v1[1], v2[0], v2[1], 0, 1, 0);
		drawLine(v2[0], v2[1], v3[0], v3[1], 0, 1, 0);
		drawLine(v3[0], v3[1], v1[0], v1[1], 0, 1, 0);
	}
}

function drawScene(deltaTime)
{
	clearFramebuffer();
	renderState.vertexShader = vertexShader;
	renderState.viewportMatrix = mat4.viewport(width, height);
	vertexBuffer = [0, 0, 0, 0.5, 0.5, 0, 0, 0.5, 0];
	draw(vertexBuffer);
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

		if(debugLine)
		{
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
		}
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
	var checkboxDebugLine = document.getElementById("checkbox-debug-line");
	checkboxDebugLine.checked = debugLine;
	var lastUpdateTime = (new Date).getTime();
	var lastUpdateFpsTime = lastUpdateTime;
	var frameCount = 0;
	setInterval(function(){
		var currentTime = (new Date).getTime();
		var deltaTime = (currentTime - lastUpdateTime) / 1000;
		lastUpdateTime = currentTime;
		if(currentTime - lastUpdateFpsTime > 1000)
		{
			var labelFps = document.getElementById("label-fps");
			labelFps.innerHTML = "FPS: " + frameCount;
			lastUpdateFpsTime = currentTime;
			frameCount = 0;
		}
		totalTime += deltaTime;
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

function toggleDebugLine()
{
	var checkboxDebugLine = document.getElementById("checkbox-debug-line");
	debugLine = checkboxDebugLine.checked;
}

function start()
{
	init();
}
