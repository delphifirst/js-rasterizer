function vertexShader(attributes)
{
	var position = attributes[0];

	position[3] = 1;
	position = mat4.transform(this.worldMatrix, position);
	position = mat4.transform(this.viewMatrix, position);
	position = mat4.transform(this.projectionMatrix, position);
	position = mat4.transform(this.viewportMatrix, position);

	attributes[0] = position;

	return attributes;
}

function texture2D(textureData, u, v)
{
	var i = Math.floor(textureData.height * v) % textureData.height;
	var j = Math.floor(textureData.width * u) % textureData.width;
	var pixelIndex = i * textureData.width * 4 + j * 4;
	return vec4.fromValues(textureData.data[pixelIndex], textureData.data[pixelIndex + 1], textureData.data[pixelIndex + 2], 1);
}

function pixelShader(varyings)
{
	var uv = varyings[2];
	var diffuse = texture2D(this.textureData, uv[0], uv[1]);
	return diffuse;
}
