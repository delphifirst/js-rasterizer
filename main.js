var debug = false;
var debugLine = true;
var debugPixelSize = 20;

var width, height;

var canvas;
var canvasWidth, canvasHeight;
var canvasContext;
var canvasImageData;

var totalTime = 0;

var renderState = {
	framebuffer: undefined,
	depthbuffer: undefined,
	vertexShader: undefined,
	pixelShader: undefined,
	textureData: {
		width: 0,
		height: 0,
		data: null,
	},
	viewportMatrix: mat4.identity(),
	projectionMatrix: mat4.identity(),
	viewMatrix: mat4.identity(),
	worldMatrix: mat4.identity(),
};

function clearFramebuffer()
{
	for(var i = 0; i < height * width * 4; ++i)
		renderState.framebuffer[i] = 0;
}

function clearDepthbuffer()
{
	for(var i = 0; i < height * width; ++i)
		renderState.depthbuffer[i] = 1;
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
	// The first element in each vertex is always position
	// Here the vertex position is homogenized
	var w1 = vertex1[0][3], w2 = vertex2[0][3], w3 = vertex3[0][3];
	var v1h = vec4.scale(1 / w1, vertex1[0]);
	var v2h = vec4.scale(1 / w2, vertex2[0]);
	var v3h = vec4.scale(1 / w3, vertex3[0]);

	var minX = Math.min(v1h[0], v2h[0], v3h[0]);
	var maxX = Math.max(v1h[0], v2h[0], v3h[0]);
	var minY = Math.min(v1h[1], v2h[1], v3h[1]);
	var maxY = Math.max(v1h[1], v2h[1], v3h[1]);

	var varyingCount = vertex1.length;

	function f12(x, y)
	{
		return (v1h[1] - v2h[1]) * x
			+ (v2h[0] - v1h[0]) * y
			+ v1h[0] * v2h[1] - v2h[0] * v1h[1];
	}

	function f23(x, y)
	{
		return (v2h[1] - v3h[1]) * x
			+ (v3h[0] - v2h[0]) * y
			+ v2h[0] * v3h[1] - v3h[0] * v2h[1];
	}

	function f31(x, y)
	{
		return (v3h[1] - v1h[1]) * x
			+ (v1h[0] - v3h[0]) * y
			+ v3h[0] * v1h[1] - v1h[0] * v3h[1];
	}

	var startY = Math.floor(minY), startX = Math.floor(minX);
	var endY = Math.ceil(maxY), endX = Math.ceil(maxX);
	for(var y = startY; y <= endY; ++y)
		for(var x = startX; x <= endX; ++x)
		{
			var alpha = f23(x, y) / f23(v1h[0], v1h[1]);
			var beta = f31(x, y) / f31(v2h[0], v2h[1]);
			var gamma = f12(x, y) / f12(v3h[0], v3h[1]);

			if(alpha > 0 && beta > 0 && gamma > 0)
			{
				// Interpolate attributes
				var oneOverW = alpha / w1 + beta / w2 + gamma / w3;
				var varyings = new Array(varyingCount);
				for(var varyingIndex = 0; varyingIndex < varyingCount; ++varyingIndex)
				{
					varyings[varyingIndex] = vec4.scale(1 / oneOverW, vec4.add(
						vec4.scale(alpha / w1, vertex1[varyingIndex]),
						vec4.add(vec4.scale(beta / w2, vertex2[varyingIndex]),
							vec4.scale(gamma / w3, vertex3[varyingIndex]))
						));
				}

				var color = renderState.pixelShader(varyings);
				drawPixel(x, y, varyings[0][2] / varyings[0][3], color[0], color[1], color[2]);
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
	var rotationMatrixX = mat4.fromRotationX(0.2 * totalTime);
	var rotationMatrixY = mat4.fromRotationY(0.3 * totalTime);
	var rotationMatrixZ = mat4.fromRotationZ(0.1 * totalTime);
	renderState.worldMatrix = mat4.mul(rotationMatrixX, mat4.mul(rotationMatrixY, rotationMatrixZ));
	renderState.viewMatrix = mat4.lookAt(vec4.fromValues(2, 1.5, 2, 1), vec4.fromValues(0, 0, 0, 1), vec4.fromValues(0, 1, 0, 0));
	renderState.projectionMatrix = mat4.perspective(Math.PI / 2, width / height, 1, 100);
	draw(modelCube.format, modelCube.vertices);
}

function render(deltaTime)
{
	drawScene(deltaTime);

	if(debug)
	{
		for(var i = 0; i < height; ++i)
			for(var j = 0; j < width; ++j)
			{
				var pixelStartIndex = i * width * 4 + j * 4;
				r = Math.floor(255 * renderState.framebuffer[pixelStartIndex]);
				g = Math.floor(255 * renderState.framebuffer[pixelStartIndex + 1]);
				b = Math.floor(255 * renderState.framebuffer[pixelStartIndex + 2]);
				canvasContext.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
				canvasContext.fillRect(j * debugPixelSize, i * debugPixelSize, debugPixelSize, debugPixelSize);
			}

		if(debugLine)
		{
			canvasContext.beginPath();
			canvasContext.lineWidth = 2;
			canvasContext.strokeStyle = "rgb(0, 128, 255)";
			for(var i = 0; i <= height; ++i)
			{
				canvasContext.moveTo(0, i * debugPixelSize);
				canvasContext.lineTo(width * debugPixelSize, i * debugPixelSize);
			}
			for(var i = 0; i <= width; ++i)
			{
				canvasContext.moveTo(i * debugPixelSize, 0);
				canvasContext.lineTo(i * debugPixelSize, height * debugPixelSize);
			}
			canvasContext.stroke();
		}
	}
	else
	{
		var data = canvasImageData.data;

		for(var pixelIndex = 0; pixelIndex < data.length;)
		{
			data[pixelIndex] = 255 * renderState.framebuffer[pixelIndex];
			++pixelIndex;
			data[pixelIndex] = 255 * renderState.framebuffer[pixelIndex];
			++pixelIndex;
			data[pixelIndex] = 255 * renderState.framebuffer[pixelIndex];
			++pixelIndex;
			data[pixelIndex] = 255;
			++pixelIndex;
		}
		canvasContext.putImageData(canvasImageData, 0, 0);
	}
}

function initFramebufferDepthbuffer()
{
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

function changeTexture(textureName)
{
	var img = document.getElementById(textureName);
	var textureCanvas = document.getElementById("texture-canvas");
	var context = textureCanvas.getContext("2d");
	context.drawImage(img, 0, 0);
	var textureImageData = context.getImageData(0, 0,
		textureCanvas.attributes.width.value, textureCanvas.attributes.height.value);
	renderState.textureData.width = textureImageData.width;
	renderState.textureData.height = textureImageData.height;
	renderState.textureData.data = new Float32Array(textureImageData.data.length);
	for(var i = 0; i < textureImageData.data.length; ++i)
		renderState.textureData.data[i] = textureImageData.data[i] / 255;
}

function init()
{
	canvas = document.getElementById("raster-canvas");
	canvasWidth = canvas.attributes.width.value;
	canvasHeight = canvas.attributes.height.value;
	canvasContext = canvas.getContext("2d");
	canvasImageData = canvasContext.createImageData(canvasWidth, canvasHeight);

	initFramebufferDepthbuffer();
	changeTexture("texture-madoka");
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
	canvasContext.fillStyle = "rgb(255,255,255)";
	canvasContext.fillRect(0, 0, canvasWidth, canvasHeight);
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
