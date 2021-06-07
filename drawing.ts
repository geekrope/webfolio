﻿var mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

var accuracy = 3;

var zoom = 10;

var colorsBuffer = [
	1, 1, 0,
	1, 0, 1,
	0, 1, 1
];

window.onload = () => {
	DrawScene();
	document.getElementById("approve").onclick = () => {
		accuracy = parseInt((<HTMLInputElement>document.getElementById("anglesCount")).value) / 2;
	}
}

enum EasingType {
	arc, linear
}

// 0<=t<=1
// 1>=return value>=0
function EasingFunction(t: number, type: EasingType, concomitantParam: number[]): number {
	if (type == EasingType.arc) {
		var x = -(1 - t);
		var y = Math.sin(Math.acos(x));
		return y;
	}
	else if (type == EasingType.linear) {
		return t;
	}
	return 0;
}

function Circle(angle: number, r: number) {
	return new DOMPoint(Math.cos(angle) * r, Math.sin(angle) * r);
}

var c1 = [0, 0, 0];
var c2 = [1, 0, 0];
var c3 = [1, 1, 0];

function DrawScene() {
	let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

	gl.clearColor(0.5, 0.5, 0.5, 1);
	gl.clearDepth(1.0);

	gl.viewport(0.0, 0.0, gl.canvas.width, gl.canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	Rotate();
	//CreatePlane();
	//InitSimpleShape();
	CreateSphere();

	requestAnimationFrame(DrawScene);
}

function InitGL(vertices: number[], colors: number[], indices: number[]) {
	let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

	var vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	// Create and store data into color buffer
	var color_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	// Create and store data into index buffer
	var index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

	/*=================== Shaders =========================*/

	var vertCode = `attribute vec3 position;
		uniform mat4 Pmatrix;
		uniform mat4 Vmatrix;
		uniform mat4 Mmatrix;
		attribute vec3 color;
		varying vec3 vColor;

		void main(void) {
		gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
		vColor = color;
		}`;

	var fragCode = `precision mediump float;
		varying vec3 vColor;
		void main(void) {
		gl_FragColor = vec4(vColor, 1.);
		}`;

	var vertShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertShader, vertCode);
	gl.compileShader(vertShader);

	var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragShader, fragCode);
	gl.compileShader(fragShader);

	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertShader);
	gl.attachShader(shaderProgram, fragShader);
	gl.linkProgram(shaderProgram);

	/* ====== Associating attributes to vertex shader =====*/
	var Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
	var Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
	var Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	var position = gl.getAttribLocation(shaderProgram, "position");
	gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

	// Position
	gl.enableVertexAttribArray(position);
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
	var color = gl.getAttribLocation(shaderProgram, "color");
	gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);

	// Color
	gl.enableVertexAttribArray(color);
	gl.useProgram(shaderProgram);

	/*==================== MATRIX =====================*/

	function get_projection(angle, a, zMin, zMax) {
		var ang = Math.tan((angle * .5) * Math.PI / 180);//angle*.5
		return [
			0.5 / ang, 0, 0, 0,
			0, 0.5 * a / ang, 0, 0,
			0, 0, -(zMax + zMin) / (zMax - zMin), -1,
			0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
		];
	}

	var proj_matrix = get_projection(60, gl.canvas.width / gl.canvas.height, 1, 100);

	var view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

	gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
	gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
	gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
}

function CreatePlaneSegment(zOffset: number, rotationAngle: number) {
	let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

	var vertices = [
		-1, 0.2, 1,
		1, 0.2, 1,
		1, 0, -1,
		-1, 0, -1
	];

	var colors = [
		0, 0, 0,
		0, 0, 0,
		0, 0, 0,
		0, 0, 0
	];

	var indices = [
		0, 1, 2, 0, 2, 3
	];

	InitGL(vertices, colors, indices);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	translateZ(mov_matrix, zOffset);

	//rotateX(mov_matrix, rotationAngle);

	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

	//rotateX(mov_matrix, -rotationAngle);

	mov_matrix[14] = -zoom;
}

function Rotate() {
	var param = [];
	var easing = EasingType.arc;
	if (rotateT < 90 && (deltaY != 0 || deltaX != 0)) {
		if (deltaY != 0) {
			rotateX(mov_matrix, -deltaY / Math.abs(deltaY) / 2 * Math.PI * EasingFunction(rotateT / 90, easing, param));
		}
		if (deltaX != 0) {
			rotateY(mov_matrix, -deltaX / Math.abs(deltaX) / 2 * Math.PI * EasingFunction(rotateT / 90, easing, param));
		}
		rotateT += defaultDelta;
		if (deltaY != 0) {
			rotateX(mov_matrix, deltaY / Math.abs(deltaY) / 2 * Math.PI * EasingFunction(rotateT / 90, easing, param));
		}
		if (deltaX != 0) {
			rotateY(mov_matrix, deltaX / Math.abs(deltaX) / 2 * Math.PI * EasingFunction(rotateT / 90, easing, param));
		}
	}
	else {
		rotationEnded = true;
		deltaX = 0;
		deltaY = 0;
		rotateT = 0;
	}
}

function CreatePlane() {
	for (let index = 0; index < 10; index++) {
		CreatePlaneSegment(-index * 2, Math.PI / 2);
	}
}

function CreateSphere() {
	mov_matrix[14] = -zoom;

	let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

	var vertices = [
	];

	var colors = [
	];

	var indices = [
	];

	const parallelsCount = 30;
	var count = 30;

	var addColor = () => {
		for (let index: number = 0; index < colorsBuffer.length; index++) {
			colors.push(colorsBuffer[index]);
		}
	};

	for (let y: number = 0; y <= parallelsCount; y += 1) {
		var absoluteY = (y - parallelsCount / 2) / (parallelsCount / 2);
		var xStart = -Math.sqrt(1 - Math.pow(absoluteY, 2));
		var radius = -xStart;
		for (let x: number = 0; x < count; x += 1) {
			var absoluteX = (x) / (count - 1) * 2 * radius + xStart;
			var z = Math.sin(Math.acos(absoluteX / radius)) * radius;
			if (isNaN(z)) {
				z = 0;
			}
			vertices.push(absoluteX, absoluteY, z);
			addColor();
		}
	}

	for (let y: number = 0; y <= parallelsCount; y += 1) {
		var absoluteY = (y - parallelsCount / 2) / (parallelsCount / 2);
		var xStart = -Math.sqrt(1 - Math.pow(absoluteY, 2));
		var radius = -xStart;
		for (let x: number = 0; x < count; x += 1) {
			var absoluteX = (x) / (count - 1) * 2 * radius + xStart;
			var z = Math.sin(Math.acos(absoluteX / radius)) * radius;
			if (isNaN(z)) {
				z = 0;
			}
			vertices.push(absoluteX, absoluteY, -z);
			addColor();
		}
	}

	let index1 = 0;
	let index2 = count;
	var bounds = 0;
	for (let y: number = 0; y <= parallelsCount; y += 1) {
		index1 = bounds;
		bounds += count;
		index2 = bounds;
		for (; index1 < bounds - 1;) {
			indices.push(index1);
			indices.push(index2);
			indices.push(index2 + 1);

			indices.push(index1);
			indices.push(index1 + 1);
			indices.push(index2 + 1);
			index1++;
			index2++;
		}
	}

	for (let y: number = 0; y <= parallelsCount; y += 1) {
		index1 = bounds;
		bounds += count;
		index2 = bounds;
		for (; index1 < bounds - 1;) {
			indices.push(index1);
			indices.push(index2);
			indices.push(index2 + 1);

			indices.push(index1);
			indices.push(index1 + 1);
			indices.push(index2 + 1);
			index1++;
			index2++;
		}
	}

	const vertexNormals = [

	];

	InitGL(vertices, colors, indices);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.drawElements(gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0);

	mov_matrix[14] = -zoom;
}

function InitSimpleShape() {
	mov_matrix[14] = -zoom;

	let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

	var vertices = [
	];

	var colors = [
	];

	let r = 1;

	const vertexNormals = [

	];

	for (let angle = 0; angle < accuracy * 2; angle += 1) {
		var radians = (angle / accuracy) * Math.PI;

		var p1 = Circle(radians, r);
		var p2 = Circle(radians + Math.PI / accuracy, r);

		var x = p1.x;
		var y = p1.y;

		var x2 = p2.x;
		var y2 = p2.y;

		for (let i = 0; i < c1.length * 4; i++) {
			colors.push(c1[i % 3]);
		}

		var nP = Circle((radians + radians + Math.PI / accuracy) / 2, r);

		vertexNormals.push(nP.x, nP.y, 0);
		vertexNormals.push(nP.x, nP.y, 0);
		vertexNormals.push(nP.x, nP.y, 0);
		vertexNormals.push(nP.x, nP.y, 0);

		vertices.push(x, y, -1);
		vertices.push(x2, y2, -1);
		vertices.push(x2, y2, 1);
		vertices.push(x, y, 1);
	}

	vertices.push(0, 0, 1);

	for (let i = 0; i < c2.length; i++) {
		colors.push(c2[i % 3]);
	}

	for (let angle = 0; angle < accuracy * 2; angle += 1) {
		var radians = (angle / accuracy) * Math.PI;

		var p1 = Circle(radians, r);
		var p2 = Circle(radians + Math.PI / accuracy, r);

		var x = p1.x;
		var y = p1.y;

		var x2 = p2.x;
		var y2 = p2.y;

		for (let i = 0; i < c2.length * 2; i++) {
			colors.push(c2[i % 3]);
		}

		vertices.push(x2, y2, 1);
		vertices.push(x, y, 1);
	}

	vertices.push(0, 0, -1);

	for (let i = 0; i < c3.length; i++) {
		colors.push(c3[i % 3]);
	}

	for (let angle = 0; angle < accuracy * 2; angle += 1) {
		var radians = (angle / accuracy) * Math.PI;

		var p1 = Circle(radians, r);
		var p2 = Circle(radians + Math.PI / accuracy, r);

		var x = p1.x;
		var y = p1.y;

		var x2 = p2.x;
		var y2 = p2.y;

		for (let i = 0; i < c3.length * 2; i++) {
			colors.push(c3[i % 3]);
		}

		vertices.push(x2, y2, -1);
		vertices.push(x, y, -1);
	}

	var indices = [
	];

	for (let index = 0; index < accuracy * 2 * 4; index += 4) {
		indices.push(index);
		indices.push(index + 1);
		indices.push(index + 2);
		indices.push(index + 0);
		indices.push(index + 2);
		indices.push(index + 3);
	}

	for (let index = accuracy * 2 * 4; index < accuracy * 2 * 4 + accuracy * 2 * 2; index += 2) {
		indices.push(accuracy * 2 * 4);
		indices.push(index + 1);
		indices.push(index + 2);
	}

	for (let index = accuracy * 2 * 4 + accuracy * 2 * 2 + 1; index < accuracy * 2 * 4 + accuracy * 2 * 2 + accuracy * 2 * 2; index += 2) {
		indices.push(accuracy * 2 * 4 + accuracy * 2 * 2 + 1);
		indices.push(index + 1);
		indices.push(index + 2);
	}

	InitGL(vertices, colors, indices);

	gl.enable(gl.DEPTH_TEST);
	gl.depthFunc(gl.LEQUAL);

	gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

	mov_matrix[14] = -zoom;
}

function rotateZ(m, angle) {
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var mv0 = m[0], mv4 = m[4], mv8 = m[8];

	m[0] = c * m[0] - s * m[1];
	m[4] = c * m[4] - s * m[5];
	m[8] = c * m[8] - s * m[9];

	m[1] = c * m[1] + s * mv0;
	m[5] = c * m[5] + s * mv4;
	m[9] = c * m[9] + s * mv8;
}

function rotateX(m, angle) {
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var mv1 = m[1], mv5 = m[5], mv9 = m[9];

	m[1] = m[1] * c - m[2] * s;
	m[5] = m[5] * c - m[6] * s;
	m[9] = m[9] * c - m[10] * s;

	m[2] = m[2] * c + mv1 * s;
	m[6] = m[6] * c + mv5 * s;
	m[10] = m[10] * c + mv9 * s;
}

function rotateY(m, angle) {
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var mv0 = m[0], mv4 = m[4], mv8 = m[8];

	m[0] = c * m[0] + s * m[2];
	m[4] = c * m[4] + s * m[6];
	m[8] = c * m[8] + s * m[10];

	m[2] = c * m[2] - s * mv0;
	m[6] = c * m[6] - s * mv4;
	m[10] = c * m[10] - s * mv8;
}

function translateX(m, offset) {
	m[12] += offset;
}

function translateY(m, offset) {
	m[13] += offset;
}

function translateZ(m, offset) {
	m[14] += offset;
}

function scaleX(m, value) {
	m[0] *= value;
	m[1] *= value;
	m[2] *= value;
}

function scaleY(m, value) {
	m[4] *= value;
	m[5] *= value;
	m[6] *= value;
}

function scaleZ(m, value) {
	m[10] *= value;
	m[9] *= value;
	m[8] *= value;
}

const defaultDelta = 3;
var deltaX = 0;
var deltaY = 0;
var rotateT = 0;
var rotationEnded = true;
var scaled = false;

document.ondblclick = () => {

}

var mouseDown = new DOMPoint();

document.onmousedown = (ev) => {
	if (!rotationEnded) {
		return;
	}
	mouseDown.x = ev.pageX;
	mouseDown.y = ev.pageY;
}

document.onwheel = (ev) => {
	//zoom += ev.deltaY / 1200;
	var value = ev.deltaY / Math.abs(ev.deltaY) * 0.1 + 1;
	scaleX(mov_matrix, value);
	scaleY(mov_matrix, value);
	scaleZ(mov_matrix, value);
}

document.onmouseup = (ev) => {
	if (!rotationEnded) {
		return;
	}
	if (mouseDown.x == ev.pageX && mouseDown.y == ev.pageY) {
		return;
	}
	if (Math.abs(ev.pageX - mouseDown.x) > Math.abs(ev.pageY - mouseDown.y)) {
		if (ev.pageX - mouseDown.x < 0) {
			deltaX = -defaultDelta;
			rotationEnded = false;
		}
		else {
			deltaX = defaultDelta;
			rotationEnded = false;
		}
	}
	else {
		if (ev.pageY - mouseDown.y < 0) {
			deltaY = -defaultDelta;
			rotationEnded = false;
		}
		else {
			deltaY = defaultDelta;
			rotationEnded = false;
		}
	}
}

function transposeMat4(matrix: number[]): number[] {
	var newMatrix = [
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0
	];
	for (let index = 0; index < matrix.length; index++) {
		var col = index % 4;
		var row = Math.floor(index / 4);
		var newIndex = col * 4 + row;
		newMatrix[newIndex] = matrix[index];
	}
	return newMatrix;
}

function inverseMat4(matrix: number[]): number[] {
	var newMatrix = [
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0
	];
	return newMatrix;
}

function loadTexture(gl, url) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array([0, 0, 255, 255]);
	gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
		width, height, border, srcFormat, srcType,
		pixel);

	const image = new Image();
	image.onload = function () {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
			srcFormat, srcType, image);

		if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	};
	image.src = url;

	return texture;
}

function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}