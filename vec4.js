var vec4 = {};

vec4.create = function()
{
	return [0, 0, 0, 0];
}

vec4.fromValues = function(x, y, z, w)
{
	return [x, y, z, w];
}

vec4.str = function(v)
{
	return "vec4(" + v[0] + ", " + v[1] + ", " + v[2] + ", " + v[3] + ")";
}

vec4.len = function(v)
{
	return Math.sqrt(vec4.sqrLen(v));
}

vec4.sqrLen = function(v)
{
	return vec4.dot(v, v);
}

vec4.neg = function(v)
{
	return[-v[0], -v[1], -v[2], -v[3]];
}

vec4.normalized = function(v)
{
	len = vec4.len(v);
	if(len == 0)
		return vec4.create();
	else
		return vec4.scale(1 / len, v);
}

vec4.add = function(v1, v2)
{
	return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2], v1[3] + v2[3]];
}

vec4.sub = function(v1, v2)
{
	return vec4.add(v1, vec4.neg(v2));
}

vec4.mul = function(v1, v2)
{
	return [v1[0] * v2[0], v1[1] * v2[1], v1[2] * v2[2], v1[3] * v2[3]];
}

vec4.scale = function(a, v)
{
	return [a * v[0], a * v[1], a * v[2], a * v[3]];
}

vec4.dot = function(v1, v2)
{
	return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2] + v1[3] * v2[3];
}

vec4.cross = function(v1, v2)
{
	return [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0], 0];
}

vec4.exactEquals = function(v1, v2)
{
	return v1[0] === v2[0] && v1[1] === v2[1] && v1[2] === v2[2] && v1[3] === v2[3];
}

vec4.equals = function(v1, v2)
{
	return vec4.len(vec4.sub(v1, v2)) < 0.000001;
}

vec4.unitTest = function()
{
	var a = vec4.create();
	a[0] = 1;
	a[3] = 2;
	var b = vec4.fromValues(1, 2, 3, 4);
	console.log("vec4.len: " + vec4.str(b) + " -> " + vec4.len(b));
	console.log("vec4.sqrLen: " + vec4.str(b) + " -> " + vec4.sqrLen(b));
	console.log("vec4.neg: " + vec4.str(b) + " -> " + vec4.str(vec4.neg(b)));
	console.log("vec4.normalized: " + vec4.str(b) + " -> " + vec4.str(vec4.normalized(b)));
	console.log("vec4.add: " + vec4.str(a) + ", " + vec4.str(b) + " -> " + vec4.str(vec4.add(a, b)));
	console.log("vec4.sub: " + vec4.str(a) + ", " + vec4.str(b) + " -> " + vec4.str(vec4.sub(a, b)));
	console.log("vec4.mul: " + vec4.str(a) + ", " + vec4.str(b) + " -> " + vec4.str(vec4.mul(a, b)));
	console.log("vec4.scale: 2, " + vec4.str(b) + " -> " + vec4.str(vec4.scale(2, b)));
	console.log("vec4.dot: " + vec4.str(a) + ", " + vec4.str(b) + " -> " + vec4.dot(a, b));
	console.log("vec4.cross: " + vec4.str(a) + ", " + vec4.str(b) + " -> " + vec4.str(vec4.cross(a, b)));
	console.log("vec4.exactEquals: " + vec4.str(a) + ", " + vec4.str(b) + " -> " + vec4.exactEquals(a, b));
	console.log("vec4.equals: " + vec4.str(a) + ", " + vec4.str(b) + " -> " + vec4.equals(a, b));
}
