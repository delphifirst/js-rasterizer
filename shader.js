function vertexShader(renderState, vertexBuffer)
{
	var vertexCount = vertexBuffer.length / 3;
	var result = new Array(vertexCount * 4);
	for(var i = 0; i < vertexCount; ++i)
	{
		var vertexData = vertexBuffer.slice(i * 3, i * 3 + 3);
		var vertex = vec4.fromValues(vertexData[0], vertexData[1], vertexData[2], 1);
		vertex = mat4.transform(renderState.worldMatrix, vertex);
		vertex = mat4.transform(renderState.viewMatrix, vertex);
		vertex = mat4.transform(renderState.projectionMatrix, vertex);
		vertex = mat4.transform(renderState.viewportMatrix, vertex);
		result[i * 4] = vertex[0];
		result[i * 4 + 1] = vertex[1];
		result[i * 4 + 2] = vertex[2];
		result[i * 4 + 3] = vertex[3];
	}
	return result;
}
