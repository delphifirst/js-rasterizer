var debug = false;
var debugLine = true;
var debugPixelSize = 20;
var width;
var height;

var totalTime = 0;

var renderState = {
	framebuffer: undefined,
	depthbuffer: undefined,
	vertexShader: undefined,
	pixelShader: undefined,
	viewportMatrix: mat4.identity(),
	projectionMatrix: mat4.identity(),
	viewMatrix: mat4.identity(),
	worldMatrix: mat4.identity(),
};

function clearFramebuffer()
{
	for(var i = 0; i < height; ++i)
		for(var j = 0; j < width; ++j)
		{
			var pixelStartIndex = i * width * 4 + j * 4;
			renderState.framebuffer[pixelStartIndex] = 0;
			renderState.framebuffer[pixelStartIndex + 1] = 0;
			renderState.framebuffer[pixelStartIndex + 2] = 0;
		}
}

function clearDepthbuffer()
{
	for(var i = 0; i < height; ++i)
		for(var j = 0; j < width; ++j)
		{
			var pixelIndex = i * width + j;
			renderState.depthbuffer[pixelIndex] = 1;
		}
}

function drawPixel(x, y, z, r, g, b)
{
	var i = Math.floor(height - y - 0.5);
	if(i >= 0 && i < height)
	{
		var j = Math.floor(x + 0.5);
		if(j >= 0 && j < width)
		{
			var depthPixelIndex = i * width + j;
			if(z < renderState.depthbuffer[depthPixelIndex])
			{
				// Pass depth test
				renderState.depthbuffer[depthPixelIndex] = z;
				var pixelStartIndex = i * width * 4 + j * 4;
				renderState.framebuffer[pixelStartIndex] = r;
				renderState.framebuffer[pixelStartIndex + 1] = g;
				renderState.framebuffer[pixelStartIndex + 2] = b;
			}
		}
	}
}

function drawTriangle(vertex1, vertex2, vertex3)
{
	var minX = Math.min(vertex1[0][0], vertex2[0][0], vertex3[0][0]);
	var maxX = Math.max(vertex1[0][0], vertex2[0][0], vertex3[0][0]);
	var minY = Math.min(vertex1[0][1], vertex2[0][1], vertex3[0][1]);
	var maxY = Math.max(vertex1[0][1], vertex2[0][1], vertex3[0][1]);

	function f12(x, y)
	{
		return (vertex1[0][1] - vertex2[0][1]) * x
			+ (vertex2[0][0] - vertex1[0][0]) * y
			+ vertex1[0][0] * vertex2[0][1] - vertex2[0][0] * vertex1[0][1];
	}

	function f23(x, y)
	{
		return (vertex2[0][1] - vertex3[0][1]) * x
			+ (vertex3[0][0] - vertex2[0][0]) * y
			+ vertex2[0][0] * vertex3[0][1] - vertex3[0][0] * vertex2[0][1];
	}

	function f31(x, y)
	{
		return (vertex3[0][1] - vertex1[0][1]) * x
			+ (vertex1[0][0] - vertex3[0][0]) * y
			+ vertex3[0][0] * vertex1[0][1] - vertex1[0][0] * vertex3[0][1];
	}

	for(var y = Math.floor(minY); y <= Math.ceil(maxY); ++y)
		for(var x = Math.floor(minX); x <= Math.ceil(maxX); ++x)
		{
			var alpha = f23(x, y) / f23(vertex1[0][0], vertex1[0][1]);
			var beta = f31(x, y) / f31(vertex2[0][0], vertex2[0][1]);
			var gamma = f12(x, y) / f12(vertex3[0][0], vertex3[0][1]);

			if(alpha > 0 && beta > 0 && gamma > 0)
			{
				var varyings = new Array(vertex1.length);
				for(var varyingIndex = 0; varyingIndex < varyings.length; ++varyingIndex)
				{
					varyings[varyingIndex] = vec4.add(
						vec4.scale(alpha, vertex1[varyingIndex]),
						vec4.add(vec4.scale(beta, vertex2[varyingIndex]),
							vec4.scale(gamma, vertex3[varyingIndex]))
						);
				}
				console.log(varyings);
				var color = renderState.pixelShader(varyings);
				drawPixel(x, y, varyings[0][2], color[0], color[1], color[2]);
			}
		}
}

function draw(format, vertexBuffer)
{
	var vertexSize = format.reduce(function(previousValue, currentValue){return previousValue + currentValue;});
	var vertexCount = vertexBuffer.length / vertexSize;
	var processedVertexBuffer = new Array(vertexCount);
	for(var vertexIndex = 0; vertexIndex < vertexCount; ++vertexIndex)
	{
		// Process vertex one by one
		var attributes = new Array(format.length);
		for(var attributeIndex = 0, bufferIndex = 0; attributeIndex < attributes.length; ++attributeIndex)
		{
			var attribute = vec4.create();
			for(var i = 0; i < format[attributeIndex]; ++i)
			{
				attribute[i] = vertexBuffer[vertexIndex * vertexSize + bufferIndex];
				++bufferIndex;
			}
			attributes[attributeIndex] = attribute;
		}
		processedVertexBuffer[vertexIndex] = renderState.vertexShader(attributes);
	}

	var triangleCount = vertexCount / 3;

	for(var triangleIndex = 0; triangleIndex < triangleCount; ++triangleIndex)
	{
		var v1 = processedVertexBuffer[3 * triangleIndex];
		var v2 = processedVertexBuffer[3 * triangleIndex + 1];
		var v3 = processedVertexBuffer[3 * triangleIndex + 2];
		v1[0] = vec4.scale(1 / v1[0][3], v1[0]);
		v2[0] = vec4.scale(1 / v2[0][3], v2[0]);
		v3[0] = vec4.scale(1 / v3[0][3], v3[0]);
		drawTriangle(v1, v2, v3);
	}
}

function drawScene(deltaTime)
{
	clearFramebuffer();
	clearDepthbuffer();
	renderState.vertexShader = vertexShader;
	renderState.pixelShader = pixelShader;
	renderState.viewportMatrix = mat4.viewport(width, height, 0, 1);
	var rotationMatrix = mat4.fromRotationY(0.3 * totalTime);
	renderState.worldMatrix = rotationMatrix;
	renderState.viewMatrix = mat4.lookAt(vec4.fromValues(3, 2, 3, 1), vec4.fromValues(0, 0, 0, 1), vec4.fromValues(0, 1, 0, 0));
	renderState.projectionMatrix = mat4.perspective(Math.PI / 2, width / height, 1, 100);
	draw(modelCube.format, modelCube.vertices);
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
				r = Math.floor(255 * renderState.framebuffer[pixelStartIndex]);
				g = Math.floor(255 * renderState.framebuffer[pixelStartIndex + 1]);
				b = Math.floor(255 * renderState.framebuffer[pixelStartIndex + 2]);
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
				data[pixelStartIndex] = 255 * renderState.framebuffer[pixelStartIndex];
				data[pixelStartIndex + 1] = 255 * renderState.framebuffer[pixelStartIndex + 1];
				data[pixelStartIndex + 2] = 255 * renderState.framebuffer[pixelStartIndex + 2];
				data[pixelStartIndex + 3] = 255;
			}
		context.putImageData(imageData, 0, 0);
	}
}

function initFramebufferDepthbuffer()
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
	renderState.framebuffer = new Float32Array(width * height * 4);
	for(var i = 0; i < renderState.framebuffer.length; ++i)
		renderState.framebuffer[i] = 0;
	renderState.depthbuffer = new Float32Array(width * height);
	for(var i = 0; i < renderState.depthbuffer.length; ++i)
		renderState.depthbuffer[i] = 0;
}

function init()
{
	initFramebufferDepthbuffer();
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
	initFramebufferDepthbuffer();
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
