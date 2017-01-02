mat4 = {}

mat4.create = function()
{
	return [0, 0, 0, 0,
			0, 0, 0, 0,
			0, 0, 0, 0,
			0, 0, 0, 0];
}

mat4.fromCols = function(v1, v2, v3, v4)
{
	return [v1[0], v2[0], v3[0], v4[0],
			v1[1], v2[1], v3[1], v4[1],
			v1[2], v2[2], v3[2], v4[2],
			v1[3], v2[3], v3[3], v4[3]];
}

mat4.fromRows = function(v1, v2, v3, v4)
{
	return mat4.transposed(mat4.fromCols(v1, v2, v3, v4));
}

mat4.fromScale = function(scale)
{
	return [scale, 0, 0, 0,
			0, scale, 0, 0,
			0, 0, scale, 0,
			0, 0, 0, 1];
}

mat4.fromTranslation = function(v)
{
	return [1, 0, 0, v[0],
			0, 1, 0, v[1],
			0, 0, 1, v[2],
			0, 0, 0, 1];
}

mat4.fromRotationX = function(angle)
{
	return [1, 0, 0, 0,
			0, Math.cos(angle), -Math.sin(angle), 0,
			0, Math.sin(angle), Math.cos(angle), 0,
			0, 0, 0, 1];
}

mat4.fromRotationY = function(angle)
{
	return [Math.cos(angle), 0, Math.sin(angle), 0,
			0, 1, 0, 0,
			-Math.sin(angle), 0, Math.cos(angle), 0,
			0, 0, 0, 1];
}

mat4.fromRotationZ = function(angle)
{
	return [Math.cos(angle), -Math.sin(angle), 0, 0,
			Math.sin(angle), Math.cos(angle), 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1];
}

mat4.lookAt = function(eye, center, up)
{
	var w = vec4.neg(vec4.normalized(vec4.sub(center, eye)));
	var u = vec4.normalized(vec4.cross(up, w));
	var v = vec4.cross(w, u);
	return mat4.invert(mat4.fromCols(u, v, w, eye));
}

mat4.identity = function()
{
	return [1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1];
}

mat4.viewport = function(nx, ny)
{
	return [nx / 2, 0, 0, (nx - 1) / 2,
			0, ny / 2, 0, (ny - 1) / 2,
			0, 0, 1, 0,
			0, 0, 0, 1];
}

mat4.str = function(m)
{
	var result = "mat4(\n";
	for(var i = 0; i < 4; ++i)
	{
		for(var j = 0; j < 4; ++j)
		{
			result += mat4.get(m, i, j) + ",";
			if(j != 3)
				result += "\t";
		}
		if(i != 3)
			result += "\n";
	}
	result += ")";
	return result;
}

mat4.get = function(m, row, col)
{
	return m[4 * row + col];
}

mat4.getCol = function(m, col)
{
	return vec4.fromValues(m[col], m[col + 4], m[col + 8], m[col + 12]);
}

mat4.getRow = function(m, row)
{
	return vec4.fromValues(m[4 * row], m[4 * row + 1], m[4 * row + 2], m[4 * row + 3]);
}

mat4.set = function(m, row, col, val)
{
	m[4 * row + col] = val;
}

mat4.transposed = function(m)
{
	return [m[0], m[4], m[8], m[12],
			m[1], m[5], m[9], m[13],
			m[2], m[6], m[10], m[14],
			m[3], m[7], m[11], m[15]];
}

mat4.neg = function(m)
{
	var result = mat4.create();
	for(var i = 0; i < 16; ++i)
		result[i] = -m[i];
	return result;
}

mat4.add = function(m1, m2)
{
	var result = mat4.create();
	for(var i = 0; i < 16; ++i)
		result[i] = m1[i] + m2[i];
	return result;
}

mat4.sub = function(m1, m2)
{
	return mat4.add(m1, mat4.neg(m2));
}

mat4.elemMul = function(m1, m2)
{
	var result = mat4.create();
	for(var i = 0; i < 16; ++i)
		result[i] = m1[i] * m2[i];
	return result;
}

mat4.scale = function(a, m)
{
	var result = mat4.create();
	for(var i = 0; i < 16; ++i)
		result[i] = a * m[i];
	return result;
}

mat4.mul = function(m1, m2)
{
	var result = mat4.create();
	for(var i = 0; i < 4; ++i)
		for(var j = 0; j < 4; ++j)
			mat4.set(result, i, j, vec4.dot(mat4.getRow(m1, i), mat4.getCol(m2, j)));
	return result;
}

mat4.cofactor = function(m, row, col)
{
	var sign = (row + col) % 2 === 0 ? 1 : -1;
	var remainMat = new Array(9);
	for(var i = 0, srcRow = 0; i < 3; ++srcRow)
	{
		if(srcRow === row)
			continue;
		for(var j = 0, srcCol = 0; j < 3; ++srcCol)
		{
			if(srcCol === col)
				continue;
			remainMat[3 * i + j] = mat4.get(m, srcRow, srcCol);
			++j;
		}
		++i;
	}
	var remainMatDet = remainMat[0] * remainMat[4] * remainMat[8]
					+ remainMat[2] * remainMat[3] * remainMat[7]
					+ remainMat[6] * remainMat[1] * remainMat[5]
					- remainMat[2] * remainMat[4] * remainMat[6]
					- remainMat[0] * remainMat[5] * remainMat[7]
					- remainMat[8] * remainMat[3] * remainMat[1];
	return sign * remainMatDet;
}

mat4.det = function(m)
{
	var result = 0;
	for(var i = 0; i < 4; ++i)
		result += mat4.get(m, i, 0) * mat4.cofactor(m, i, 0);
	return result;
}

mat4.invert = function(m)
{
	var cofactorMatrix = mat4.create();
	for(var i = 0; i < 4; ++i)
		for(var j = 0; j < 4; ++j)
			mat4.set(cofactorMatrix, i, j, mat4.cofactor(m, i, j));
	cofactorMatrix = mat4.transposed(cofactorMatrix);
	return mat4.scale(1 / mat4.det(m), cofactorMatrix);
}

mat4.transform = function(m, v)
{
	var result = vec4.create();
	for(var i = 0; i < 4; ++i)
		result[i] = vec4.dot(mat4.getRow(m, i), v);
	return result;
}

mat4.unitTest = function()
{
	var m = mat4.fromRows(vec4.fromValues(1, 2, 0, 4),
							vec4.fromValues(5, 1, 2, 8),
							vec4.fromValues(1, 3, 4, 2),
							vec4.fromValues(3, 1, 5, 9));
	console.log("mat4.getRow: " + mat4.str(m) + ", 2 -> " + vec4.str(mat4.getRow(m, 2)))
	console.log("mat4.getCol: " + mat4.str(m) + ", 2 -> " + vec4.str(mat4.getCol(m, 2)))
	console.log("mat4.transposed: " + mat4.str(m) + " -> " + mat4.str(mat4.transposed(m)));
	console.log("mat4.neg: " + mat4.str(m) + " -> " + mat4.str(mat4.neg(m)));
	console.log("mat4.add: " + mat4.str(m) + ", " + mat4.str(m) + " -> " + mat4.str(mat4.add(m, m)));
	console.log("mat4.sub: " + mat4.str(m) + ", " + mat4.str(m) + " -> " + mat4.str(mat4.sub(m, m)));
	console.log("mat4.elemMul: " + mat4.str(m) + ", " + mat4.str(m) + " -> " + mat4.str(mat4.elemMul(m, m)));
	console.log("mat4.mul: " + mat4.str(m) + ", " + mat4.str(m) + " -> " + mat4.str(mat4.mul(m, m)));
	console.log("mat4.scale: 2, " + mat4.str(m) + " -> " + mat4.str(mat4.scale(2, m)));
	console.log("mat4.cofactor: " + mat4.str(m) + ", 1, 2 -> " + mat4.cofactor(m, 1, 2));
	console.log("mat4.det: " + mat4.str(m) + " -> " + mat4.det(m));
	console.log("mat4.invert: " + mat4.str(m) + " -> " + mat4.str(mat4.invert(m)));
}
