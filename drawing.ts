/// <reference path="rasterizesvg.ts" />

interface Drawable {
	CalculateEdges(): void;
	Draw(): void;
}

function InitBuffers() {

}

class Shape implements Drawable {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	public constructor() {
		this.mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
		this.Opacity = 1;
	}
	public Opacity: number;
	public Colors: number[];
	public InitGL(vertices: number[], colors: number[], indices: number[]) {
		let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

		var vertex_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		var color_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

		var index_buffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

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
		gl_FragColor = vec4(vColor, ${this.Opacity});
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

		var Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
		var Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
		var Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

		gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
		var position = gl.getAttribLocation(shaderProgram, "position");
		gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(position);
		gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
		var color = gl.getAttribLocation(shaderProgram, "color");
		gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);

		gl.enableVertexAttribArray(color);
		gl.useProgram(shaderProgram);

		function get_projection(angle, a, zMin, zMax) {
			var ang = Math.tan((angle * .5) * Math.PI / 180);
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
		gl.uniformMatrix4fv(Mmatrix, false, this.mov_matrix);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
	}
	public CalculateEdges(): void {

	}
	public Draw(): void {
		let gl = (<HTMLCanvasElement>document.getElementById(id)).getContext("webgl");
		this.InitGL(this.vertices, this.Colors, this.indices);

		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	}
	public rotateZ(angle: number): void {
		var m = this.mov_matrix;
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
	public rotateX(angle: number): void {
		var m = this.mov_matrix;
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
	public rotateY(angle: number): void {
		var m = this.mov_matrix;
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
	public translateX(offset: number): void {
		var m = this.mov_matrix;
		m[12] += offset;
	}
	public translateY(offset: number): void {
		var m = this.mov_matrix;
		m[13] += offset;
	}
	public translateZ(offset: number): void {
		var m = this.mov_matrix;
		m[14] += offset;
	}
	public scaleX(value: number): void {
		var m = this.mov_matrix;
		m[0] *= value;
		m[1] *= value;
		m[2] *= value;
	}
	public scaleY(value: number): void {
		var m = this.mov_matrix;
		m[4] *= value;
		m[5] *= value;
		m[6] *= value;
	}
	public scaleZ(value: number): void {
		var m = this.mov_matrix;
		m[10] *= value;
		m[9] *= value;
		m[8] *= value;
	}
	public clearMatrix(): void {
		this.mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
	}
}

class Sphere extends Shape {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	protected quality: number;
	public Opacity: number;
	public get Quality(): number {
		return this.quality;
	}
	public set Quality(value: number) {
		this.quality = value;
		this.CalculateEdges();
	}
	public Colors: number[];
	public InitGL(vertices: number[], colors: number[], indices: number[]) {
		super.InitGL(vertices, colors, indices);
	}
	public rotateZ(angle: number): void {
		super.rotateZ(angle);
	}
	public rotateX(angle: number): void {
		super.rotateX(angle);
	}
	public rotateY(angle: number): void {
		super.rotateY(angle);
	}
	public translateX(offset: number): void {
		super.translateX(offset);
	}
	public translateY(offset: number): void {
		super.translateY(offset);
	}
	public translateZ(offset: number): void {
		super.translateZ(offset);
	}
	public scaleX(value: number): void {
		super.scaleX(value);
	}
	public scaleY(value: number): void {
		super.scaleY(value);
	}
	public scaleZ(value: number): void {
		super.scaleZ(value);
	}
	public CalculateEdges(): void {
		var vertices = [
		];

		var colors = [
		];

		var indices = [
		];

		const parallelsCount = this.Quality;
		var count = this.Quality;

		var orange = [
			1, 0.5, 0,
		];

		var black = [
			0, 0, 0,
		];

		var red = [
			1, 0, 0,
		];

		var pink = [
			1, 0, 1,
		];

		var addColor = (buffer: number[]) => {
			let index: number = 0;
			for (; index < buffer.length; index++) {
				colors.push(buffer[index]);
			}
		};

		var calcHalf = (zSign: number) => {
			for (let angleRelativeY: number = 0; angleRelativeY < parallelsCount; angleRelativeY += 1) {
				var absoluteY = Math.sin((angleRelativeY / (parallelsCount - 1) * Math.PI) + Math.PI / 2);
				var xStart = -Math.sqrt(1 - Math.pow(absoluteY, 2));
				var radius = -xStart;
				for (let angleRelativeX: number = 0; angleRelativeX < count; angleRelativeX += 1) {
					var absoluteX = Math.cos((angleRelativeX) / (count - 1) * Math.PI) * radius;
					var z = Math.sin(Math.acos(absoluteX / radius)) * radius;
					if (isNaN(z)) {
						z = 0;
					}
					vertices.push(absoluteX, absoluteY, z * zSign);
				}
			}
		}

		for (let i = 0; i < parallelsCount; i++) {
			for (let i2 = 0; i2 < count; i2++) {
				if (i % 2 == 0) {
					addColor(orange);
				}
				else {
					addColor(black);
				}
			}
		}

		for (let i = 0; i < parallelsCount; i++) {
			for (let i2 = 0; i2 < count; i2++) {
				if (i % 2 == 0) {
					addColor(orange);
				}
				else {
					addColor(black);
				}
			}
		}

		calcHalf(1);
		calcHalf(-1);

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

		this.vertices = vertices;
		this.indices = indices;
		this.Colors = colors;

		this.mov_matrix[14] = -zoom;
	}
	public constructor() {
		super();
		this.Quality = 50;
		this.CalculateEdges();
	}
	public Draw(): void {
		super.Draw();
	}
	public clearMatrix() {
		super.clearMatrix();
	}
}

class RegularPolygon extends Shape {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	protected n: number;
	private Circle(angle: number, r: number): DOMPoint {
		return new DOMPoint(Math.cos(angle) * r, Math.sin(angle) * r);
	}
	public Opacity: number;
	public get N() {
		return this.n;
	}
	public set N(value: number) {
		this.n = value;
		this.CalculateEdges();
	}
	public Colors: number[];
	public InitGL(vertices: number[], colors: number[], indices: number[]) {
		super.InitGL(vertices, colors, indices);
	}
	public rotateZ(angle: number): void {
		super.rotateZ(angle);
	}
	public rotateX(angle: number): void {
		super.rotateX(angle);
	}
	public rotateY(angle: number): void {
		super.rotateY(angle);
	}
	public translateX(offset: number): void {
		super.translateX(offset);
	}
	public translateY(offset: number): void {
		super.translateY(offset);
	}
	public translateZ(offset: number): void {
		super.translateZ(offset);
	}
	public scaleX(value: number): void {
		super.scaleX(value);
	}
	public scaleY(value: number): void {
		super.scaleY(value);
	}
	public scaleZ(value: number): void {
		super.scaleZ(value);
	}
	public CalculateEdges(): void {
		var accuracy = this.N / 2;

		var vertices = [
		];

		var colors = [
		];

		let r = 1;

		const vertexNormals = [

		];

		for (let angle = 0; angle < accuracy * 2; angle += 1) {
			var radians = (angle / accuracy) * Math.PI;

			var p1 = this.Circle(radians, r);
			var p2 = this.Circle(radians + Math.PI / accuracy, r);

			var x = p1.x;
			var y = p1.y;

			var x2 = p2.x;
			var y2 = p2.y;

			for (let i = 0; i < c1.length * 4; i++) {
				colors.push(c1[i % 3]);
			}

			var nP = this.Circle((radians + radians + Math.PI / accuracy) / 2, r);

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

			var p1 = this.Circle(radians, r);
			var p2 = this.Circle(radians + Math.PI / accuracy, r);

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

			var p1 = this.Circle(radians, r);
			var p2 = this.Circle(radians + Math.PI / accuracy, r);

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

		this.vertices = vertices;
		this.indices = indices;
		this.Colors = colors;

		this.mov_matrix[14] = -zoom;
	}
	public constructor() {
		super();
		this.N = 4;
		this.CalculateEdges();
	}
	public Draw(): void {
		super.Draw();
	}
	public clearMatrix() {
		super.clearMatrix();
	}
}

enum ParticleType {
	Cube, Sphere
}

class Particle {
	public angleX: number;
	public angleY: number;
	public angleZ: number;
	public rotationX: number;
	public rotationY: number;
	public rotationZ: number;
	public scale: number;
	public distance: number;
	public distanceMax: number;
	public constructor(angleX: number, angleY: number, angleZ: number, distance: number, scale: number, rotationX: number, rotationY: number, rotationZ: number, distanceMax) {
		this.angleX = angleX;
		this.angleY = angleY;
		this.angleZ = angleZ;
		this.distance = distance;
		this.scale = scale;
		this.rotationX = rotationX;
		this.rotationY = rotationY;
		this.rotationZ = rotationZ;
		this.distanceMax = distanceMax;
	}
}

class ParticlesGeneratorProperties {
	public count: number;
	public colorBuffer: number[];
	public maxDistance: number;
	public minDistance: number;
	public speed: number;
	public minSize: number;
	public maxSize: number;
	public countOnFrame: number;
}

class ParticlesGenerator extends Shape {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	protected particles: Particle[] = [];
	protected _type: ParticleType;
	protected started: boolean;
	protected finished: number;
	protected generated: number;
	protected properties: ParticlesGeneratorProperties;
	protected GenerateParticle(): Particle {
		var angleX = Math.random() * Math.PI;
		var angleY = Math.random() * Math.PI;
		var angleZ = Math.random() * Math.PI;

		var rotationX = Math.random() * Math.PI;
		var rotationY = Math.random() * Math.PI;
		var rotationZ = Math.random() * Math.PI;

		var scale = Math.random() * (this.Properties.maxSize - this.Properties.minSize) + this.Properties.minSize;
		//180deg
		return new Particle(angleX, angleY, angleZ, 0, scale, rotationX, rotationY, rotationZ, Math.random() * (this.Properties.maxDistance - this.Properties.minDistance) + this.Properties.minDistance);
	}
	public get Type(): ParticleType {
		return this._type;
	}
	public set Type(value: ParticleType) {
		this._type = value;
		this.CalculateEdges();
	}
	public Opacity: number;
	public get Properties(): ParticlesGeneratorProperties {
		return this.properties;
	}
	public set Properties(value: ParticlesGeneratorProperties) {
		this.properties = value;
	}
	public InitGL(vertices: number[], colors: number[], indices: number[]) {
		super.InitGL(vertices, colors, indices);
	}
	public rotateZ(angle: number): void {
		super.rotateZ(angle);
	}
	public rotateX(angle: number): void {
		super.rotateX(angle);
	}
	public rotateY(angle: number): void {
		super.rotateY(angle);
	}
	public translateX(offset: number): void {
		super.translateX(offset);
	}
	public translateY(offset: number): void {
		super.translateY(offset);
	}
	public translateZ(offset: number): void {
		super.translateZ(offset);
	}
	public scaleX(value: number): void {
		super.scaleX(value);
	}
	public scaleY(value: number): void {
		super.scaleY(value);
	}
	public scaleZ(value: number): void {
		super.scaleZ(value);
	}
	public CalculateEdges(): void {
		var vertices = [];
		var colors = [];
		var indices = [];
		if (this._type == ParticleType.Cube) {
			vertices = [
				-1.0, -1.0, 1.0,
				1.0, -1.0, 1.0,
				1.0, 1.0, 1.0,
				-1.0, 1.0, 1.0,

				-1.0, -1.0, -1.0,
				-1.0, 1.0, -1.0,
				1.0, 1.0, -1.0,
				1.0, -1.0, -1.0,

				-1.0, 1.0, -1.0,
				-1.0, 1.0, 1.0,
				1.0, 1.0, 1.0,
				1.0, 1.0, -1.0,

				-1.0, -1.0, -1.0,
				1.0, -1.0, -1.0,
				1.0, -1.0, 1.0,
				-1.0, -1.0, 1.0,

				1.0, -1.0, -1.0,
				1.0, 1.0, -1.0,
				1.0, 1.0, 1.0,
				1.0, -1.0, 1.0,

				-1.0, -1.0, -1.0,
				-1.0, -1.0, 1.0,
				-1.0, 1.0, 1.0,
				-1.0, 1.0, -1.0
			];
			colors = [
				1, 0, 0,
				1, 0, 0,
				1, 0, 0,
				1, 0, 0,

				0, 1, 0,
				0, 1, 0,
				0, 1, 0,
				0, 1, 0,

				0, 0, 1,
				0, 0, 1,
				0, 0, 1,
				0, 0, 1,

				1, 0, 1,
				1, 0, 1,
				1, 0, 1,
				1, 0, 1,

				1, 1, 1,
				1, 1, 1,
				1, 1, 1,
				1, 1, 1,

				1, 1, 0,
				1, 1, 0,
				1, 1, 0,
				1, 1, 0,
			];

			indices = [
				0, 1, 2, 0, 2, 3,
				4, 5, 6, 4, 6, 7,
				8, 9, 10, 8, 10, 11,
				12, 13, 14, 12, 14, 15,
				16, 17, 18, 16, 18, 19,
				20, 21, 22, 20, 22, 23
			];

			this.vertices = vertices;
			this.indices = indices;
			this.Colors = colors;
		}
		else if (this._type == ParticleType.Sphere) {
			const parallelsCount = 15;
			var count = 15;

			var yellow = [
				1, 1, 0,
			];

			var green = [
				0, 1, 0,
			];

			var red = [
				1, 0, 0,
			];

			var pink = [
				1, 0, 1,
			];

			var addColor = (buffer: number[]) => {
				let index: number = 0;
				for (; index < buffer.length; index++) {
					colors.push(buffer[index]);
				}
			};

			var calcHalf = (zSign: number) => {
				for (let angleRelativeY: number = 0; angleRelativeY < parallelsCount; angleRelativeY += 1) {
					var absoluteY = Math.sin((angleRelativeY / (parallelsCount - 1) * Math.PI) + Math.PI / 2);
					var xStart = -Math.sqrt(1 - Math.pow(absoluteY, 2));
					var radius = -xStart;
					for (let angleRelativeX: number = 0; angleRelativeX < count; angleRelativeX += 1) {
						var absoluteX = Math.cos((angleRelativeX) / (count - 1) * Math.PI) * radius;
						var z = Math.sin(Math.acos(absoluteX / radius)) * radius;
						if (isNaN(z)) {
							z = 0;
						}
						vertices.push(absoluteX, absoluteY, z * zSign);
					}
				}
			}

			for (let i = 0; i < parallelsCount; i++) {
				for (let i2 = 0; i2 < count; i2++) {
					if (i < (parallelsCount - 1) / 2) {
						addColor(yellow);
					}
					else {
						addColor(green);
					}
				}
			}

			for (let i = 0; i < parallelsCount; i++) {
				for (let i2 = 0; i2 < count; i2++) {
					if (i < (parallelsCount - 1) / 2) {
						addColor(red);
					}
					else {
						addColor(pink);
					}
				}
			}

			calcHalf(1);
			calcHalf(-1);

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

			this.vertices = vertices;
			this.indices = indices;
			this.Colors = colors;
		}
		this.mov_matrix[14] = -zoom;
	}
	public Start(): void {
		if (this.Properties.count != 0) {
			this.particles.push(this.GenerateParticle());
		}
		this.started = true;
	}
	public constructor() {
		super();
		this.Type = ParticleType.Sphere;
		this.Properties = {
			count: -1,
			maxDistance: 5,
			minDistance: 1,
			speed: 0.1,
			colorBuffer: [1, 0, 1],
			minSize: 0.01,
			maxSize: 0.1,
			countOnFrame: 20
		}
		this.finished = 0;
		this.generated = 0;
	}
	public Draw(): void {
		let gl = (<HTMLCanvasElement>document.getElementById(id)).getContext("webgl");
		if (this.started) {
			for (let index = 0; index < this.particles.length; index++) {
				var x = Math.cos(this.particles[index].angleX) * this.particles[index].distance;
				var y = Math.sin(this.particles[index].angleY) * this.particles[index].distance;
				var z = Math.sin(this.particles[index].angleZ) * this.particles[index].distance;

				if (isNaN(z)) {
					z = 0;
				}

				var movMatrix = Array.from(this.mov_matrix);

				this.translateX(x);
				this.translateY(y);
				this.translateZ(z);

				this.rotateX(this.particles[index].rotationX);
				this.rotateY(this.particles[index].rotationY);
				this.rotateZ(this.particles[index].rotationZ);

				var scaleValue = 1 - this.particles[index].distance / this.particles[index].distanceMax;

				this.scaleX(this.particles[index].scale * scaleValue);
				this.scaleY(this.particles[index].scale * scaleValue);
				this.scaleZ(this.particles[index].scale * scaleValue);

				this.InitGL(this.vertices, this.Colors, this.indices);

				gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

				this.mov_matrix = movMatrix;

				if (this.particles[index].distance >= this.particles[index].distanceMax && (this.generated < this.Properties.count || this.Properties.count == -1)) {
					this.finished++;
					this.generated++;
					this.particles[index] = this.GenerateParticle();
					continue;
				}
				this.particles[index].distance += this.Properties.speed;
			}
			if (this.particles.length < this.Properties.countOnFrame) {
				this.particles.push(this.GenerateParticle());
			}
			if (this.finished >= this.Properties.count && this.Properties.count != -1) {
				this.particles = [];
				this.finished = 0;
				this.generated = 0;
				this.started = false;
			}
		}
	}
	public clearMatrix() {
		super.clearMatrix();
	}
}

var mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

var c1 = [0, 0, 0];
var c2 = [1, 0, 0];
var c3 = [1, 1, 0];

var currentShape: Shape;

var Shapes: Shape[] = [];

var zoom = 10;

const id = "cnvs";

enum EasingType {
	arc, linear, quad
}

function EasingFunction(t: number, type: EasingType, concomitantParam: number[]): number {
	if (type == EasingType.arc) {
		var x = -(1 - t);
		var y = Math.sin(Math.acos(x));
		return y;
	}
	else if (type == EasingType.linear) {
		return t;
	}
	else if (type == EasingType.quad) {
		return t * t;
	}
	return 0;
}

function DrawScene() {
	let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

	gl.clearColor(0.5, 0.5, 0.5, 1);
	gl.clearDepth(1.0);

	gl.viewport(0.0, 0.0, gl.canvas.width, gl.canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	Rotate();
	for (let index = 0; index < Shapes.length; index++) {
		Shapes[index].Draw();
	}

	requestAnimationFrame(DrawScene);
}

function Rotate() {
	var param = [];
	var easing = EasingType.arc;
	if (rotateT < 90 && (deltaY != 0 || deltaX != 0)) {
		if (deltaY != 0) {
			currentShape.rotateX(-deltaY / Math.abs(deltaY) / 2 * Math.PI * EasingFunction(rotateT / 90, easing, param));
		}
		if (deltaX != 0) {
			currentShape.rotateY(-deltaX / Math.abs(deltaX) / 2 * Math.PI * EasingFunction(rotateT / 90, easing, param));
		}
		rotateT += defaultDelta;
		if (deltaY != 0) {
			currentShape.rotateX(deltaY / Math.abs(deltaY) / 2 * Math.PI * EasingFunction(rotateT / 90, easing, param));
		}
		if (deltaX != 0) {
			currentShape.rotateY(deltaX / Math.abs(deltaX) / 2 * Math.PI * EasingFunction(rotateT / 90, easing, param));
		}
	}
	else {
		rotationEnded = true;
		deltaX = 0;
		deltaY = 0;
		rotateT = 0;
	}
}

const defaultDelta = 3;
var deltaX = 0;
var deltaY = 0;
var rotateT = 0;
var rotationEnded = true;
var scaled = false;
var mouseDown = new DOMPoint();

window.onload = () => {
	document.getElementById("approve").onclick = () => {
		//accuracy = parseInt((<HTMLInputElement>document.getElementById("anglesCount")).value) / 2;
	}
	window.onresize(new UIEvent("resize"));
	currentShape = new Sphere();
	var generator = new ParticlesGenerator();
	generator.Type = ParticleType.Cube;
	generator.Start();
	Shapes.push(currentShape);
	Shapes.push(generator);
	DrawScene();

	ParseSvg(`<svg width="373" height="349" viewBox="0 0 373 349" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.088 76.23C7.524 76.23 4.785 75.174 2.871 73.062C0.957 70.884 0 68.211 0 65.043C0 62.667 0.561 60.753 1.683 59.301C2.739 57.849 4.224 57.123 6.138 57.123C7.656 57.123 8.877 57.618 9.801 58.608C10.791 59.532 11.286 60.753 11.286 62.271C11.286 63.855 10.89 65.043 10.098 65.835C9.372 66.627 8.448 66.957 7.326 66.825C7.392 67.683 7.722 68.442 8.316 69.102C8.91 69.696 9.867 69.993 11.187 69.993C13.299 69.993 14.916 68.805 16.038 66.429C17.226 64.053 18.414 60.159 19.602 54.747C16.698 54.153 14.388 52.899 12.672 50.985C11.022 49.071 10.197 46.497 10.197 43.263C10.197 38.181 12.243 34.056 16.335 30.888C20.427 27.72 27.06 26.136 36.234 26.136H51.282L46.035 50.688C45.375 53.526 44.814 56.001 44.352 58.113C43.89 60.225 43.659 61.677 43.659 62.469C43.659 65.241 44.979 66.627 47.619 66.627C48.873 66.627 49.995 66.33 50.985 65.736C50.259 72.006 47.157 75.504 41.679 76.23C37.917 76.23 35.013 75.24 32.967 73.26C30.987 71.214 29.997 68.706 29.997 65.736C29.997 63.822 30.591 60.126 31.779 54.648C29.997 55.044 28.149 55.242 26.235 55.242C25.047 60.324 23.892 64.317 22.77 67.221C21.648 70.125 20.163 72.369 18.315 73.953C16.467 75.471 14.058 76.23 11.088 76.23ZM31.086 50.589C31.812 50.589 32.34 50.523 32.67 50.391L36.828 31.482H34.452C30.624 31.482 27.687 32.538 25.641 34.65C23.661 36.696 22.671 39.468 22.671 42.966C22.671 48.048 25.047 50.589 29.799 50.589H31.086Z" fill="white"/>
<path d="M76.4543 45.837H96.2543L94.5713 53.658H74.6723L76.4543 45.837Z" fill="white"/>
<path d="M116.058 76.032C110.976 76.032 107.049 74.679 104.277 71.973C101.571 69.201 100.218 64.977 100.218 59.301C100.218 54.153 101.274 49.236 103.386 44.55C105.564 39.864 108.699 36.069 112.791 33.165C116.883 30.261 121.701 28.809 127.245 28.809L128.928 28.908C127.872 27.654 126.255 25.938 124.077 23.76C121.635 21.384 119.82 19.371 118.632 17.721C117.444 16.005 116.85 14.124 116.85 12.078C116.85 9.57 117.708 7.722 119.424 6.534C121.14 5.346 123.846 4.752 127.542 4.752H145.659C147.375 4.752 148.629 4.653 149.421 4.455C150.213 4.257 150.84 3.861 151.302 3.267C151.764 2.607 152.193 1.518 152.589 0H156.945C155.889 5.148 154.734 8.976 153.48 11.484C152.226 13.992 150.576 15.708 148.53 16.632C146.55 17.556 143.778 18.018 140.214 18.018H130.71C130.314 18.018 129.984 18.117 129.72 18.315C129.522 18.447 129.423 18.744 129.423 19.206C129.423 19.47 129.984 20.328 131.106 21.78C133.548 24.75 135.627 27.951 137.343 31.383C139.059 34.815 139.917 38.841 139.917 43.461C139.917 48.477 138.927 53.526 136.947 58.608C135.033 63.624 132.261 67.782 128.631 71.082C125.001 74.382 120.81 76.032 116.058 76.032ZM119.82 67.122C122.526 67.122 124.77 65.472 126.552 62.172C128.334 58.872 129.621 55.143 130.413 50.985C131.271 46.827 131.7 43.626 131.7 41.382C131.7 38.874 131.403 37.158 130.809 36.234C130.215 35.31 129.258 34.848 127.938 34.848C125.034 34.848 122.592 36.432 120.612 39.6C118.632 42.768 117.147 46.365 116.157 50.391C115.167 54.417 114.672 57.552 114.672 59.796C114.672 62.634 115.035 64.581 115.761 65.637C116.553 66.627 117.906 67.122 119.82 67.122Z" fill="white"/>
<path d="M157.607 76.23C153.119 76.23 149.621 75.108 147.113 72.864C144.671 70.62 143.45 67.518 143.45 63.558C143.45 61.578 143.681 59.697 144.143 57.915L150.677 26.136H164.339L157.013 60.984C156.815 61.512 156.716 62.436 156.716 63.756C156.716 66.462 158.201 67.815 161.171 67.815C162.953 67.815 164.669 67.089 166.319 65.637C167.969 64.119 169.289 62.106 170.279 59.598C171.269 57.09 171.764 54.351 171.764 51.381C171.764 49.731 171.269 48.477 170.279 47.619C169.421 48.213 168.464 48.51 167.408 48.51C166.286 48.51 165.263 48.147 164.339 47.421C163.481 46.695 163.052 45.639 163.052 44.253C163.052 42.801 163.613 41.679 164.735 40.887C165.857 40.095 167.144 39.699 168.596 39.699C170.114 39.699 171.467 39.897 172.655 40.293C176.879 38.379 181.928 35.64 187.802 32.076C192.554 29.238 195.986 27.258 198.098 26.136H204.236L198.989 50.688C198.329 53.526 197.768 56.001 197.306 58.113C196.844 60.225 196.613 61.677 196.613 62.469C196.613 65.241 197.933 66.627 200.573 66.627C202.421 66.627 203.906 66 205.028 64.746C206.15 63.492 207.437 61.215 208.889 57.915H213.047C208.889 70.125 202.784 76.23 194.732 76.23C190.904 76.23 188 75.207 186.02 73.161C184.04 71.049 183.05 68.475 183.05 65.439C183.05 63.063 184.865 53.757 188.495 37.521C185.393 39.501 181.697 41.646 177.407 43.956C178.991 46.398 179.783 49.698 179.783 53.856C179.783 56.958 178.958 60.258 177.308 63.756C175.658 67.188 173.15 70.125 169.784 72.567C166.484 75.009 162.425 76.23 157.607 76.23Z" fill="white"/>
<path d="M226.439 100.386C223.271 100.386 220.631 99.561 218.519 97.911C216.407 96.261 215.351 93.885 215.351 90.783C215.351 87.021 216.869 83.985 219.905 81.675C222.941 79.431 226.802 77.55 231.488 76.032L232.676 70.785C229.31 74.415 225.35 76.23 220.796 76.23C217.034 76.23 213.899 74.943 211.391 72.369C208.883 69.795 207.629 65.769 207.629 60.291C207.629 55.407 208.586 50.292 210.5 44.946C212.48 39.534 215.384 34.98 219.212 31.284C223.106 27.522 227.726 25.641 233.072 25.641C235.778 25.641 237.791 26.103 239.111 27.027C240.431 27.951 241.091 29.172 241.091 30.69V31.284L242.18 26.136H256.436L246.635 72.072C249.803 71.016 252.344 69.432 254.258 67.32C256.172 65.208 257.789 62.073 259.109 57.915H263.267C261.485 63.789 259.076 68.112 256.04 70.884C253.004 73.59 249.572 75.438 245.744 76.428L244.259 83.556C242.939 89.958 240.662 94.347 237.428 96.723C234.194 99.165 230.531 100.386 226.439 100.386ZM227.231 66.627C228.749 66.627 230.3 65.934 231.884 64.548C233.468 63.162 234.557 61.281 235.151 58.905L240.2 35.442C240.2 34.65 239.87 33.858 239.21 33.066C238.55 32.208 237.527 31.779 236.141 31.779C233.501 31.779 231.125 33.33 229.013 36.432C226.901 39.468 225.251 43.164 224.063 47.52C222.875 51.81 222.281 55.605 222.281 58.905C222.281 62.205 222.743 64.317 223.667 65.241C224.657 66.165 225.845 66.627 227.231 66.627ZM224.162 92.664C225.284 92.664 226.373 91.905 227.429 90.387C228.485 88.869 229.31 86.691 229.904 83.853L230.498 80.982C224.03 83.358 220.796 86.163 220.796 89.397C220.796 90.255 221.093 91.014 221.687 91.674C222.281 92.334 223.106 92.664 224.162 92.664Z" fill="white"/>
<path d="M266.914 76.23C263.35 76.23 260.545 75.141 258.499 72.963C256.387 70.719 255.331 68.013 255.331 64.845C255.331 62.601 255.859 60.819 256.915 59.499C257.971 58.113 259.423 57.42 261.271 57.42C262.855 57.42 264.142 57.915 265.132 58.905C266.122 59.895 266.617 61.083 266.617 62.469C266.617 64.053 266.221 65.274 265.429 66.132C264.637 66.924 263.713 67.254 262.657 67.122C262.657 69.63 263.944 70.884 266.518 70.884C268.3 70.884 269.785 70.191 270.973 68.805C272.161 67.353 273.184 65.208 274.042 62.37C274.9 59.532 275.791 55.638 276.715 50.688C277.969 44.022 279.421 38.907 281.071 35.343C282.787 31.779 284.734 29.37 286.912 28.116C289.156 26.796 291.895 26.136 295.129 26.136H309.682L304.435 50.688C303.775 53.526 303.214 56.001 302.752 58.113C302.29 60.225 302.059 61.677 302.059 62.469C302.059 65.241 303.379 66.627 306.019 66.627C307.867 66.627 309.352 66 310.474 64.746C311.596 63.492 312.883 61.215 314.335 57.915H318.493C314.335 70.125 308.098 76.23 299.782 76.23C296.152 76.23 293.347 75.207 291.367 73.161C289.387 71.115 288.397 68.64 288.397 65.736C288.397 63.426 289.123 58.938 290.575 52.272L295.228 31.185C292.72 31.185 290.674 31.713 289.09 32.769C287.572 33.825 286.285 35.607 285.229 38.115C284.173 40.623 283.183 44.154 282.259 48.708C280.807 56.166 279.553 61.677 278.497 65.241C277.507 68.739 276.121 71.445 274.339 73.359C272.557 75.273 270.082 76.23 266.914 76.23Z" fill="white"/>
<path d="M328.751 76.032C323.867 76.032 320.006 74.778 317.168 72.27C314.33 69.762 312.911 65.802 312.911 60.39C312.911 55.902 313.835 50.919 315.683 45.441C317.531 39.963 320.501 35.244 324.593 31.284C328.685 27.258 333.833 25.245 340.037 25.245C348.485 25.245 352.709 30.558 352.709 41.184C352.709 47.784 351.686 53.757 349.64 59.103C347.594 64.383 344.723 68.541 341.027 71.577C337.397 74.547 333.305 76.032 328.751 76.032ZM332.711 67.122C334.955 67.122 336.968 65.604 338.75 62.568C340.598 59.466 342.017 55.638 343.007 51.084C344.063 46.464 344.591 42.108 344.591 38.016C344.591 35.706 344.327 34.023 343.799 32.967C343.271 31.845 342.281 31.284 340.829 31.284C338.651 31.284 336.539 32.868 334.493 36.036C332.447 39.204 330.797 42.999 329.543 47.421C328.289 51.843 327.662 55.737 327.662 59.103C327.662 62.271 328.025 64.416 328.751 65.538C329.477 66.594 330.797 67.122 332.711 67.122Z" fill="white"/>
<path d="M13.563 200.23C10.395 200.23 7.821 199.24 5.841 197.26C3.927 195.28 2.97 192.31 2.97 188.35C2.97 186.7 3.234 184.555 3.762 181.915L10.494 150.136H24.75L17.622 183.796C17.424 184.786 17.325 185.71 17.325 186.568C17.325 189.274 18.315 190.627 20.295 190.627C22.143 190.627 23.727 189.868 25.047 188.35C26.367 186.766 27.423 184.621 28.215 181.915L34.947 150.136H49.203L42.075 183.796C41.811 184.786 41.679 185.842 41.679 186.964C41.679 188.284 41.976 189.241 42.57 189.835C43.23 190.363 44.286 190.627 45.738 190.627C48.708 190.627 50.952 188.614 52.47 184.588C54.054 180.496 55.407 175.414 56.529 169.342L57.123 166.273L60.489 150.136H74.745L70.884 168.55C70.686 169.54 70.587 170.464 70.587 171.322C70.587 174.028 71.577 175.381 73.557 175.381C75.471 175.381 77.121 174.589 78.507 173.005C79.959 171.421 80.949 169.309 81.477 166.669L84.942 150.136H99.198L92.07 183.796C91.806 184.786 91.674 185.842 91.674 186.964C91.674 188.284 91.971 189.241 92.565 189.835C93.225 190.363 94.281 190.627 95.733 190.627C97.581 190.627 99.165 189.835 100.485 188.251C101.871 186.667 102.96 184.555 103.752 181.915H107.91C105.468 189.043 102.432 193.894 98.802 196.468C95.238 198.976 91.641 200.23 88.011 200.23C84.843 200.23 82.269 199.24 80.289 197.26C78.375 195.28 77.418 192.31 77.418 188.35C77.418 186.7 77.682 184.555 78.21 181.915L78.705 179.44C76.791 181.552 74.844 183.004 72.864 183.796C70.884 184.588 68.871 184.984 66.825 184.984C62.931 184.984 60.06 183.598 58.212 180.826C56.364 186.7 53.757 191.419 50.391 194.983C47.091 198.481 42.966 200.23 38.016 200.23C35.178 200.23 32.901 199.438 31.185 197.854C29.535 196.27 28.545 193.927 28.215 190.825C25.971 194.455 23.595 196.93 21.087 198.25C18.645 199.57 16.137 200.23 13.563 200.23Z" fill="white"/>
<path d="M117.688 200.23C112.87 200.23 109.108 198.976 106.402 196.468C103.696 193.894 102.343 189.901 102.343 184.489C102.343 179.935 103.234 174.919 105.016 169.441C106.798 163.963 109.702 159.244 113.728 155.284C117.754 151.258 122.869 149.245 129.073 149.245C136.333 149.245 139.963 152.413 139.963 158.749C139.963 162.445 138.907 165.844 136.795 168.946C134.683 172.048 131.878 174.556 128.38 176.47C124.882 178.318 121.153 179.374 117.193 179.638C117.061 181.09 116.995 182.08 116.995 182.608C116.995 188.086 119.041 190.825 123.133 190.825C124.981 190.825 126.961 190.33 129.073 189.34C131.185 188.35 133.099 187.096 134.815 185.578C133.033 195.346 127.324 200.23 117.688 200.23ZM117.886 174.886C120.394 174.82 122.737 173.995 124.915 172.411C127.159 170.827 128.941 168.814 130.261 166.372C131.647 163.864 132.34 161.257 132.34 158.551C132.34 155.845 131.515 154.492 129.865 154.492C127.555 154.492 125.245 156.604 122.935 160.828C120.691 164.986 119.008 169.672 117.886 174.886Z" fill="white"/>
<path d="M150.379 176.668C150.379 173.5 150.841 170.662 151.765 168.154C152.755 165.58 153.91 163.369 155.23 161.521C156.616 159.673 158.398 157.528 160.576 155.086C163.414 151.918 165.526 149.146 166.912 146.77C168.364 144.328 169.09 141.49 169.09 138.256C169.09 135.418 168.529 133.207 167.407 131.623C166.285 130.039 164.668 129.247 162.556 129.247C160.378 129.247 158.53 130.039 157.012 131.623C155.56 133.141 154.834 135.055 154.834 137.365C154.834 139.081 155.263 140.665 156.121 142.117C156.979 143.503 158.134 144.526 159.586 145.186V145.582C158.398 146.638 157.144 147.463 155.824 148.057C154.57 148.651 153.349 148.948 152.161 148.948C150.049 148.948 148.3 148.189 146.914 146.671C145.594 145.087 144.934 143.074 144.934 140.632C144.934 137.53 145.825 134.725 147.607 132.217C149.455 129.709 151.93 127.729 155.032 126.277C158.134 124.825 161.599 124.099 165.427 124.099C170.773 124.099 174.997 125.32 178.099 127.762C181.201 130.204 182.752 133.537 182.752 137.761C182.752 140.335 182.191 142.711 181.069 144.889C179.947 147.001 178.528 148.882 176.812 150.532C175.162 152.182 172.951 154.129 170.179 156.373C167.209 158.881 164.866 160.993 163.15 162.709C161.434 164.425 159.949 166.471 158.695 168.847C157.507 171.157 156.913 173.764 156.913 176.668H150.379ZM152.458 199.636C150.346 199.636 148.498 198.877 146.914 197.359C145.33 195.775 144.538 193.894 144.538 191.716C144.538 189.538 145.297 187.69 146.815 186.172C148.399 184.654 150.28 183.895 152.458 183.895C154.636 183.895 156.484 184.654 158.002 186.172C159.586 187.69 160.378 189.538 160.378 191.716C160.378 193.894 159.586 195.775 158.002 197.359C156.484 198.877 154.636 199.636 152.458 199.636Z" fill="white"/>
<path d="M18.81 324.032C13.332 324.032 9.207 322.415 6.435 319.181C3.729 315.947 2.376 311.624 2.376 306.212C2.376 300.932 3.795 293.672 6.633 284.432C9.471 275.126 13.233 266.942 17.919 259.88C22.605 252.818 27.654 249.287 33.066 249.287C40.326 249.287 43.956 253.808 43.956 262.85C43.956 269.252 41.25 277.172 35.838 286.61C37.224 287.27 38.478 288.26 39.6 289.58C42.504 289.58 45.639 288.953 49.005 287.699C52.437 286.445 55.341 284.993 57.717 283.343L58.608 286.016C56.826 287.93 54.45 289.613 51.48 291.065C48.576 292.451 45.375 293.441 41.877 294.035C42.207 295.289 42.372 296.939 42.372 298.985C42.372 303.407 41.415 307.532 39.501 311.36C37.587 315.188 34.848 318.257 31.284 320.567C27.72 322.877 23.562 324.032 18.81 324.032ZM23.166 315.122C25.212 315.122 26.994 314.429 28.512 313.043C30.096 311.657 31.284 309.908 32.076 307.796C32.934 305.684 33.363 303.506 33.363 301.262C33.363 298.82 33.066 297.005 32.472 295.817C32.01 296.015 31.515 296.18 30.987 296.312C30.459 296.378 29.766 296.411 28.908 296.411C27.324 296.411 26.07 295.982 25.146 295.124C24.222 294.266 23.76 293.078 23.76 291.56C23.76 289.58 24.354 288.128 25.542 287.204C26.796 286.28 28.512 285.752 30.69 285.62C32.604 282.122 34.221 278.261 35.541 274.037C36.927 269.747 37.62 265.886 37.62 262.454C37.62 260.474 37.356 259.088 36.828 258.296C36.366 257.438 35.541 257.009 34.353 257.009C31.779 257.009 29.139 260.21 26.433 266.612C23.793 273.014 21.582 280.307 19.8 288.491C18.018 296.675 17.127 302.681 17.127 306.509C17.127 312.251 19.14 315.122 23.166 315.122Z" fill="white"/>
<path d="M62.6887 324.032C57.8047 324.032 53.9437 322.778 51.1057 320.27C48.2677 317.762 46.8487 313.802 46.8487 308.39C46.8487 303.902 47.7727 298.919 49.6207 293.441C51.4687 287.963 54.4387 283.244 58.5307 279.284C62.6227 275.258 67.7707 273.245 73.9747 273.245C82.4227 273.245 86.6467 278.525 86.6467 289.085V289.184C86.8447 289.25 87.2077 289.283 87.7357 289.283C89.9137 289.283 92.4217 288.722 95.2597 287.6C98.0977 286.412 100.672 284.993 102.982 283.343L103.873 286.016C101.959 288.062 99.4507 289.811 96.3487 291.263C93.3127 292.649 89.9797 293.639 86.3497 294.233C85.8217 300.239 84.4687 305.486 82.2907 309.974C80.1127 314.462 77.3077 317.927 73.8757 320.369C70.4437 322.811 66.7147 324.032 62.6887 324.032ZM66.6487 315.122C68.2327 315.122 69.8167 314.231 71.4007 312.449C72.9847 310.601 74.3707 308.126 75.5587 305.024C76.7467 301.856 77.6047 298.358 78.1327 294.53C76.3507 294.134 75.4597 292.748 75.4597 290.372C75.4597 287.666 76.4827 285.884 78.5287 285.026C78.3967 282.848 78.0667 281.363 77.5387 280.571C77.0107 279.713 76.0867 279.284 74.7667 279.284C72.5887 279.284 70.4767 280.868 68.4307 284.036C66.3847 287.204 64.7347 290.999 63.4807 295.421C62.2267 299.843 61.5997 303.737 61.5997 307.103C61.5997 310.271 61.9627 312.416 62.6887 313.538C63.4147 314.594 64.7347 315.122 66.6487 315.122Z" fill="white"/>
<path d="M127.48 324.23C123.454 324.23 120.484 323.174 118.57 321.062C116.722 318.884 115.798 316.211 115.798 313.043C115.798 311.657 115.963 310.106 116.293 308.39C116.623 306.608 116.953 304.892 117.283 303.242C117.679 301.592 117.943 300.536 118.075 300.074C118.603 297.764 119.098 295.487 119.56 293.243C120.022 290.999 120.253 289.184 120.253 287.798C120.253 284.432 119.065 282.749 116.689 282.749C114.973 282.749 113.455 283.607 112.135 285.323C110.815 286.973 109.759 289.151 108.967 291.857L102.235 323.636H87.9785L98.4725 274.136H112.729L111.64 279.284C114.94 275.588 118.801 273.74 123.223 273.74C126.589 273.74 129.262 274.664 131.242 276.512C133.222 278.36 134.212 281.165 134.212 284.927C134.212 286.841 133.981 288.986 133.519 291.362C133.057 293.672 132.397 296.51 131.539 299.876C131.011 301.922 130.516 303.935 130.054 305.915C129.658 307.829 129.46 309.347 129.46 310.469C129.46 311.789 129.757 312.812 130.351 313.538C130.945 314.264 131.968 314.627 133.42 314.627C135.4 314.627 136.984 313.934 138.172 312.548C139.36 311.096 140.548 308.885 141.736 305.915H145.894C143.452 313.175 140.614 318.059 137.38 320.567C134.212 323.009 130.912 324.23 127.48 324.23Z" fill="white"/>
<path d="M149.248 270.473H163.504L161.92 277.898C165.22 275.06 169.081 273.641 173.503 273.641C177.199 273.641 180.136 274.862 182.314 277.304C184.492 279.746 185.581 283.739 185.581 289.283C185.581 294.497 184.822 299.777 183.304 305.123C181.786 310.403 179.212 314.924 175.582 318.686C171.952 322.382 167.167 324.23 161.227 324.23C157.003 324.23 154.198 323.042 152.812 320.666L147.664 344.822L132.715 348.386L149.248 270.473ZM158.158 315.617C161.326 315.617 163.933 314.132 165.979 311.162C168.091 308.192 169.609 304.661 170.533 300.569C171.523 296.411 172.018 292.55 172.018 288.986C172.018 283.508 170.368 280.769 167.068 280.769C165.88 280.769 164.659 281.198 163.405 282.056C162.217 282.914 161.161 284.102 160.237 285.62L154.396 313.34C154.924 314.858 156.178 315.617 158.158 315.617Z" fill="white"/>
<path d="M202.487 324.032C197.603 324.032 193.742 322.778 190.904 320.27C188.066 317.762 186.647 313.802 186.647 308.39C186.647 303.902 187.571 298.919 189.419 293.441C191.267 287.963 194.237 283.244 198.329 279.284C202.421 275.258 207.569 273.245 213.773 273.245C222.221 273.245 226.445 278.525 226.445 289.085V289.184C226.643 289.25 227.006 289.283 227.534 289.283C229.712 289.283 232.22 288.722 235.058 287.6C237.896 286.412 240.47 284.993 242.78 283.343L243.671 286.016C241.757 288.062 239.249 289.811 236.147 291.263C233.111 292.649 229.778 293.639 226.148 294.233C225.62 300.239 224.267 305.486 222.089 309.974C219.911 314.462 217.106 317.927 213.674 320.369C210.242 322.811 206.513 324.032 202.487 324.032ZM206.447 315.122C208.031 315.122 209.615 314.231 211.199 312.449C212.783 310.601 214.169 308.126 215.357 305.024C216.545 301.856 217.403 298.358 217.931 294.53C216.149 294.134 215.258 292.748 215.258 290.372C215.258 287.666 216.281 285.884 218.327 285.026C218.195 282.848 217.865 281.363 217.337 280.571C216.809 279.713 215.885 279.284 214.565 279.284C212.387 279.284 210.275 280.868 208.229 284.036C206.183 287.204 204.533 290.999 203.279 295.421C202.025 299.843 201.398 303.737 201.398 307.103C201.398 310.271 201.761 312.416 202.487 313.538C203.213 314.594 204.533 315.122 206.447 315.122Z" fill="white"/>
<path d="M245.696 324.23C240.812 324.23 237.017 322.976 234.311 320.468C231.605 317.894 230.252 313.901 230.252 308.489C230.252 303.935 231.143 298.919 232.925 293.441C234.773 287.963 237.677 283.244 241.637 279.284C245.663 275.258 250.745 273.245 256.883 273.245C260.843 273.245 263.648 274.103 265.298 275.819C267.014 277.535 267.872 279.713 267.872 282.353C267.872 284.663 267.377 286.445 266.387 287.699C265.397 288.953 264.143 289.58 262.625 289.58C261.503 289.58 260.348 289.184 259.16 288.392C259.952 286.214 260.348 284.267 260.348 282.551C260.348 281.297 260.117 280.307 259.655 279.581C259.193 278.855 258.5 278.492 257.576 278.492C255.596 278.492 253.616 280.109 251.636 283.343C249.656 286.577 248.039 290.504 246.785 295.124C245.531 299.744 244.904 303.902 244.904 307.598C244.904 310.832 245.465 313.043 246.587 314.231C247.709 315.353 249.524 315.914 252.032 315.914C255.596 315.914 258.632 315.089 261.14 313.439C263.714 311.789 266.519 309.281 269.555 305.915H272.921C265.595 318.125 256.52 324.23 245.696 324.23Z" fill="white"/>
<path d="M283.097 324.23C278.609 324.23 275.111 323.108 272.603 320.864C270.161 318.62 268.94 315.518 268.94 311.558C268.94 310.238 269.171 308.357 269.633 305.915L276.167 274.136H289.829L282.503 308.984C282.305 309.512 282.206 310.436 282.206 311.756C282.206 314.462 283.691 315.815 286.661 315.815C288.443 315.815 290.159 315.089 291.809 313.637C293.459 312.119 294.779 310.106 295.769 307.598C296.759 305.09 297.254 302.351 297.254 299.381C297.254 297.731 296.759 296.477 295.769 295.619C294.911 296.213 293.954 296.51 292.898 296.51C291.776 296.51 290.753 296.147 289.829 295.421C288.971 294.695 288.542 293.639 288.542 292.253C288.542 290.801 289.103 289.679 290.225 288.887C291.347 288.095 292.634 287.699 294.086 287.699C295.604 287.699 296.957 287.897 298.145 288.293C302.369 286.379 307.418 283.64 313.292 280.076C318.044 277.238 321.476 275.258 323.588 274.136H329.726L322.499 307.796C322.235 308.786 322.103 309.842 322.103 310.964C322.103 312.284 322.4 313.241 322.994 313.835C323.654 314.363 324.71 314.627 326.162 314.627C327.35 314.627 328.406 314.429 329.33 314.033C329.066 317.333 327.878 319.874 325.766 321.656C323.72 323.372 321.278 324.23 318.44 324.23C315.536 324.23 313.193 323.24 311.411 321.26C309.695 319.28 308.837 316.31 308.837 312.35C308.837 310.7 309.101 308.555 309.629 305.915L313.985 285.521C310.883 287.501 307.187 289.646 302.897 291.956C304.481 294.398 305.273 297.698 305.273 301.856C305.273 304.958 304.448 308.258 302.798 311.756C301.148 315.188 298.64 318.125 295.274 320.567C291.974 323.009 287.915 324.23 283.097 324.23Z" fill="white"/>
<path d="M340.161 300.668C340.161 297.5 340.623 294.662 341.547 292.154C342.537 289.58 343.692 287.369 345.012 285.521C346.398 283.673 348.18 281.528 350.358 279.086C353.196 275.918 355.308 273.146 356.694 270.77C358.146 268.328 358.872 265.49 358.872 262.256C358.872 259.418 358.311 257.207 357.189 255.623C356.067 254.039 354.45 253.247 352.338 253.247C350.16 253.247 348.312 254.039 346.794 255.623C345.342 257.141 344.616 259.055 344.616 261.365C344.616 263.081 345.045 264.665 345.903 266.117C346.761 267.503 347.916 268.526 349.368 269.186V269.582C348.18 270.638 346.926 271.463 345.606 272.057C344.352 272.651 343.131 272.948 341.943 272.948C339.831 272.948 338.082 272.189 336.696 270.671C335.376 269.087 334.716 267.074 334.716 264.632C334.716 261.53 335.607 258.725 337.389 256.217C339.237 253.709 341.712 251.729 344.814 250.277C347.916 248.825 351.381 248.099 355.209 248.099C360.555 248.099 364.779 249.32 367.881 251.762C370.983 254.204 372.534 257.537 372.534 261.761C372.534 264.335 371.973 266.711 370.851 268.889C369.729 271.001 368.31 272.882 366.594 274.532C364.944 276.182 362.733 278.129 359.961 280.373C356.991 282.881 354.648 284.993 352.932 286.709C351.216 288.425 349.731 290.471 348.477 292.847C347.289 295.157 346.695 297.764 346.695 300.668H340.161ZM342.24 323.636C340.128 323.636 338.28 322.877 336.696 321.359C335.112 319.775 334.32 317.894 334.32 315.716C334.32 313.538 335.079 311.69 336.597 310.172C338.181 308.654 340.062 307.895 342.24 307.895C344.418 307.895 346.266 308.654 347.784 310.172C349.368 311.69 350.16 313.538 350.16 315.716C350.16 317.894 349.368 319.775 347.784 321.359C346.266 322.877 344.418 323.636 342.24 323.636Z" fill="white"/>
</svg>
`);
}

document.onmousedown = (ev) => {
	if (!rotationEnded) {
		return;
	}
	mouseDown.x = ev.pageX;
	mouseDown.y = ev.pageY;
}

document.onwheel = (ev) => {
	var value = ev.deltaY / Math.abs(ev.deltaY) * 0.1 + 1;
	currentShape.scaleX(value);
	currentShape.scaleY(value);
	currentShape.scaleZ(value);
}

window.onresize = (ev) => {
	var cnvs = document.getElementById("cnvs");
	cnvs.setAttribute("width", (innerWidth).toString());
	cnvs.setAttribute("height", (innerHeight).toString());
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