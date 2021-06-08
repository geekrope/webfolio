interface Drawable {
	CalculateEdges(): void;
	Draw(): void;
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
		gl.uniformMatrix4fv(Mmatrix, false, this.mov_matrix);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
	}
	public CalculateEdges(): void {

	}
	public Draw(): void {

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
	public Opacity: number;
	public Quality: number;
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
		let gl = (<HTMLCanvasElement>document.getElementById(id)).getContext("webgl");

		var vertices = [
		];

		var colors = [
		];

		var indices = [
		];

		const parallelsCount = this.Quality;
		var count = this.Quality;

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

		this.mov_matrix[14] = -zoom;
	}
	public constructor() {
		super();
		this.Quality = 50;
		this.CalculateEdges();
	}
	public Draw(): void {
		let gl = (<HTMLCanvasElement>document.getElementById(id)).getContext("webgl");
		this.InitGL(this.vertices, this.Colors, this.indices);

		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	}
	public clearMatrix() {
		super.clearMatrix();
	}
}

class RegularPolygon extends Shape {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	private Circle(angle: number, r: number): DOMPoint {
		return new DOMPoint(Math.cos(angle) * r, Math.sin(angle) * r);
	}
	public Opacity: number;
	public N: number;
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
		let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

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
		let gl = (<HTMLCanvasElement>document.getElementById(id)).getContext("webgl");
		this.InitGL(this.vertices, this.Colors, this.indices);

		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
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
	public constructor(angleX: number, angleY: number, angleZ: number, distance: number, scale: number, rotationX: number, rotationY: number, rotationZ: number) {
		this.angleX = angleX;
		this.angleY = angleY;
		this.angleZ = angleZ;
		this.distance = distance;
		this.scale = scale;
		this.rotationX = rotationX;
		this.rotationY = rotationY;
		this.rotationZ = rotationZ;
	}
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
	protected GenerateParticle() {
		var angleX = Math.random() * Math.PI;
		var angleY = Math.random() * Math.PI;
		var angleZ = Math.random() * Math.PI;

		var rotationX = Math.random() * Math.PI;
		var rotationY = Math.random() * Math.PI;
		var rotationZ = Math.random() * Math.PI;

		var scale = Math.random() * (this.Properties.maxSize - this.Properties.minSize) + this.Properties.minSize;
		//180deg
		this.particles.push(new Particle(angleX, angleY, angleZ, 0, scale, rotationX, rotationY, rotationZ));
	}
	public get Type(): ParticleType {
		return this._type;
	}
	public set Type(value: ParticleType) {
		this._type = value;
		this.CalculateEdges();
	}
	public Opacity: number;
	public Properties: {
		count: number,
		colorBuffer: number[],
		distance: number,
		speed: number,
		minSize: number,
		maxSize: number
	};
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
		let gl = (<HTMLCanvasElement>document.getElementById("cnvs")).getContext("webgl");

		var vertices = [
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

		var colors = [
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

		var indices = [
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

		this.mov_matrix[14] = -zoom;
	}
	public Start(): void {
		if (this.Properties.count != 0) {
			this.GenerateParticle();
		}
		this.started = true;
	}
	public constructor() {
		super();
		this.CalculateEdges();
		this.Properties = {
			count: 1000,
			distance: 5,
			speed: 0.1,
			colorBuffer: [1, 0, 1],
			minSize: 0.1,
			maxSize: 0.4
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

				var scaleValue = 1 - this.particles[index].distance / this.Properties.distance;

				this.scaleX(this.particles[index].scale * scaleValue);
				this.scaleY(this.particles[index].scale * scaleValue);
				this.scaleZ(this.particles[index].scale * scaleValue);

				this.InitGL(this.vertices, this.Colors, this.indices);

				gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);

				this.mov_matrix = movMatrix;

				console.log(this.mov_matrix);

				if (this.particles[index].distance >= this.Properties.distance) {
					this.finished++;
					this.particles.splice(index, 1);
					index--;
					continue;
				}

				this.particles[index].distance += this.Properties.speed;
			}
			if (this.generated < this.Properties.count) {
				this.GenerateParticle();
				this.generated++;
			}
			else {
				console.log(">>>");
			}
			if (this.finished >= this.Properties.count) {
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
	currentShape = new ParticlesGenerator();
	(<ParticlesGenerator>currentShape).Start();
	Shapes.push(currentShape);
	DrawScene();
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