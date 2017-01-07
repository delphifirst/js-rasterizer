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

function pixelShader(varyings)
{
	var color = varyings[1];
	return color;
}
