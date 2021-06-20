﻿/// <reference path="rasterizesvg.ts" />
/// <reference path="description.ts" />

interface Drawable {
	CalculateEdges(): void;
	Draw(): void;
}

type FillType = "texture" | "colors";

class Shape implements Drawable {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	protected Opacity: number;
	protected Colors: number[];
	protected FillType: FillType;
	protected TextureImage: HTMLImageElement;
	protected TextureCoords: number[];
	protected LoadedTexture: WebGLTexture;
	public SetTextureStyle(textureImage: HTMLImageElement, textureCoords: number[]) {
		this.TextureImage = textureImage;
		this.TextureCoords = textureCoords;
		this.LoadedTexture = gl.createTexture();
		this.LoadedTexture
		this.FillType = "texture";
	}
	public SetColorsStyle(colors: number[], opacity: number) {
		this.Colors = colors;
		this.Opacity = opacity;
		this.FillType = "colors";
	}
	public constructor() {
		this.mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -zoom, 1];
		this.Opacity = 1;
	}
	public InitGL() {
		if (this.FillType == "colors") {
			let vertex_buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

			let color_buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.Colors), gl.STATIC_DRAW);

			let index_buffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

			let vertCode = `attribute vec3 position;
				uniform mat4 Pmatrix;
				uniform mat4 Vmatrix;
				uniform mat4 Mmatrix;
				attribute vec3 color;
				varying vec3 vColor;

				void main(void) {
				gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
				vColor = color;
				}`;

			let fragCode = `precision mediump float;
				varying vec3 vColor;
				void main(void) {
				gl_FragColor = vec4(vColor, ${this.Opacity});
				}`;

			let vertShader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vertShader, vertCode);
			gl.compileShader(vertShader);

			let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fragShader, fragCode);
			gl.compileShader(fragShader);

			let shaderProgram = gl.createProgram();
			gl.attachShader(shaderProgram, vertShader);
			gl.attachShader(shaderProgram, fragShader);
			gl.linkProgram(shaderProgram);

			let Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
			let Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
			let Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

			gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
			let position = gl.getAttribLocation(shaderProgram, "position");
			gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

			gl.enableVertexAttribArray(position);
			gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
			let color = gl.getAttribLocation(shaderProgram, "color");
			gl.vertexAttribPointer(color, 3, gl.FLOAT, false, 0, 0);

			gl.enableVertexAttribArray(color);
			gl.useProgram(shaderProgram);

			function get_projection(angle, a, zMin, zMax) {
				let ang = Math.tan((angle * .5) * Math.PI / 180);
				return [
					0.5 / ang, 0, 0, 0,
					0, 0.5 * a / ang, 0, 0,
					0, 0, -(zMax + zMin) / (zMax - zMin), -1,
					0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
				];
			}

			let proj_matrix = get_projection(60, gl.canvas.width / gl.canvas.height, 1, zDepth);

			let view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

			gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
			gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
			gl.uniformMatrix4fv(Mmatrix, false, this.mov_matrix);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LESS);

			webGlShaderProgram = shaderProgram;
		}
		else if (this.FillType == "texture") {
			let vertex_buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

			let index_buffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);

			let vertCode = `attribute vec3 position;
				uniform mat4 Pmatrix;
				uniform mat4 Vmatrix;
				uniform mat4 Mmatrix;		
				attribute vec2 texcoord;
				varying vec2 v_texcoord;

				void main(void) {
				gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
				v_texcoord = texcoord;
				}`;

			let fragCode = `precision mediump float;
				varying vec2 v_texcoord;
				uniform sampler2D u_texture;
				void main(void) {
				gl_FragColor = texture2D(u_texture, v_texcoord);
				}`;

			let vertShader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vertShader, vertCode);
			gl.compileShader(vertShader);

			let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fragShader, fragCode);
			gl.compileShader(fragShader);

			let shaderProgram = gl.createProgram();
			gl.attachShader(shaderProgram, vertShader);
			gl.attachShader(shaderProgram, fragShader);
			gl.linkProgram(shaderProgram);

			var texcoordLocation = gl.getAttribLocation(shaderProgram, "texcoord");

			var buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			gl.enableVertexAttribArray(texcoordLocation);

			gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

			gl.bufferData(
				gl.ARRAY_BUFFER,
				new Float32Array(this.TextureCoords),
				gl.STATIC_DRAW);

			if (!this.LoadedTexture) {
				this.LoadedTexture = gl.createTexture();
			}

			configureTexture(this.TextureImage, this.LoadedTexture);

			function configureTexture(image: HTMLImageElement, texture: WebGLTexture) {
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			}

			let Pmatrix = gl.getUniformLocation(shaderProgram, "Pmatrix");
			let Vmatrix = gl.getUniformLocation(shaderProgram, "Vmatrix");
			let Mmatrix = gl.getUniformLocation(shaderProgram, "Mmatrix");

			gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
			let position = gl.getAttribLocation(shaderProgram, "position");
			gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

			gl.enableVertexAttribArray(position);
			gl.useProgram(shaderProgram);

			function get_projection(angle, a, zMin, zMax) {
				let ang = Math.tan((angle * .5) * Math.PI / 180);
				return [
					0.5 / ang, 0, 0, 0,
					0, 0.5 * a / ang, 0, 0,
					0, 0, -(zMax + zMin) / (zMax - zMin), -1,
					0, 0, (-2 * zMax * zMin) / (zMax - zMin), 0
				];
			}

			let proj_matrix = get_projection(60, gl.canvas.width / gl.canvas.height, 1, zDepth);

			let view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

			gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
			gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
			gl.uniformMatrix4fv(Mmatrix, false, this.mov_matrix);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

			gl.enable(gl.DEPTH_TEST);
			gl.depthFunc(gl.LESS);

			webGlShaderProgram = shaderProgram;
		}
	}
	public CalculateEdges(): void {

	}
	public Draw(): void {
		this.InitGL();

		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	}
	public rotateZ(angle: number): void {
		let m = this.mov_matrix;
		let c = Math.cos(angle);
		let s = Math.sin(angle);
		let mv0 = m[0], mv4 = m[4], mv8 = m[8];

		m[0] = c * m[0] - s * m[1];
		m[4] = c * m[4] - s * m[5];
		m[8] = c * m[8] - s * m[9];

		m[1] = c * m[1] + s * mv0;
		m[5] = c * m[5] + s * mv4;
		m[9] = c * m[9] + s * mv8;
	}
	public rotateX(angle: number): void {
		let m = this.mov_matrix;
		let c = Math.cos(angle);
		let s = Math.sin(angle);
		let mv1 = m[1], mv5 = m[5], mv9 = m[9];

		m[1] = m[1] * c - m[2] * s;
		m[5] = m[5] * c - m[6] * s;
		m[9] = m[9] * c - m[10] * s;

		m[2] = m[2] * c + mv1 * s;
		m[6] = m[6] * c + mv5 * s;
		m[10] = m[10] * c + mv9 * s;
	}
	public rotateY(angle: number): void {
		let m = this.mov_matrix;
		let c = Math.cos(angle);
		let s = Math.sin(angle);
		let mv0 = m[0], mv4 = m[4], mv8 = m[8];

		m[0] = c * m[0] + s * m[2];
		m[4] = c * m[4] + s * m[6];
		m[8] = c * m[8] + s * m[10];

		m[2] = c * m[2] - s * mv0;
		m[6] = c * m[6] - s * mv4;
		m[10] = c * m[10] - s * mv8;
	}
	public translateX(offset: number): void {
		let m = this.mov_matrix;
		m[12] += offset;
	}
	public translateY(offset: number): void {
		let m = this.mov_matrix;
		m[13] += offset;
	}
	public translateZ(offset: number): void {
		let m = this.mov_matrix;
		m[14] += offset;
	}
	public scaleX(value: number): void {
		let m = this.mov_matrix;
		m[0] *= value;
		m[1] *= value;
		m[2] *= value;
	}
	public scaleY(value: number): void {
		let m = this.mov_matrix;
		m[4] *= value;
		m[5] *= value;
		m[6] *= value;
	}
	public scaleZ(value: number): void {
		let m = this.mov_matrix;
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
	protected Opacity: number;
	protected Colors: number[];
	public get Quality(): number {
		return this.quality;
	}
	public set Quality(value: number) {
		this.quality = value;
		this.CalculateEdges();
	}
	public static CalculateHalfOfSphere(zSign: number, quality: number): number[] {
		let vertices = [];
		for (let angleRelativeY: number = 0; angleRelativeY < quality; angleRelativeY += 1) {
			let absoluteY = Math.sin((angleRelativeY / (quality - 1) * Math.PI) + Math.PI / 2);
			let xStart = -Math.sqrt(1 - Math.pow(absoluteY, 2));
			let radius = -xStart;
			for (let angleRelativeX: number = 0; angleRelativeX < quality; angleRelativeX += 1) {
				let absoluteX = Math.cos((angleRelativeX) / (quality - 1) * Math.PI) * radius;
				let z = Math.sin(Math.acos(absoluteX / radius)) * radius;
				if (isNaN(z)) {
					z = 0;
				}
				vertices.push(absoluteX, absoluteY, z * zSign);
			}
		}
		return vertices;
	}
	public InitGL() {
		super.InitGL();
	}
	public SetTextureStyle(textureImage: HTMLImageElement, textureCoords: number[]) {
		super.SetTextureStyle(textureImage, textureCoords);
	}
	public SetColorsStyle(colors: number[], opacity: number) {
		super.SetColorsStyle(colors, opacity);
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
		let vertices = [
		];


		let indices = [
		];


		var vert1 = Sphere.CalculateHalfOfSphere(-1, this.Quality);
		vertices = Sphere.CalculateHalfOfSphere(1, this.Quality).concat(vert1);

		let index1 = 0;
		let index2 = this.Quality;
		let bounds = 0;
		for (let y: number = 0; y <= this.Quality; y += 1) {
			index1 = bounds;
			bounds += this.Quality;
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

		for (let y: number = 0; y <= this.Quality; y += 1) {
			index1 = bounds;
			bounds += this.Quality;
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
	}
	public constructor() {
		super();
		this.Quality = 50;
		this.CalculateEdges();
		let orange = [
			1, 0.5, 0,
		];

		let black = [
			0, 0, 0,
		];

		let colors = [
		];

		let addColor = (buffer: number[]) => {
			let index: number = 0;
			for (; index < buffer.length; index++) {
				colors.push(buffer[index]);
			}
		};

		for (let i = 0; i < this.Quality; i++) {
			for (let i2 = 0; i2 < this.Quality; i2++) {
				if (i % 2 == 0) {
					addColor(orange);
				}
				else {
					addColor(black);
				}
			}
		}

		for (let i = 0; i < this.Quality; i++) {
			for (let i2 = 0; i2 < this.Quality; i2++) {
				if (i % 2 == 0) {
					addColor(orange);
				}
				else {
					addColor(black);
				}
			}
		}

		this.SetColorsStyle(colors, 1);
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
	public maxDistance: number;
	public minDistance: number;
	public speed: number;
	public minSize: number;
	public maxSize: number;
	public countOnFrame: number;
}

class ParticlesGenerator extends Shape {
	protected parallelsCount = 15;
	protected count = 15;
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
		let angleX = Math.random() * Math.PI;
		let angleY = Math.random() * Math.PI;
		let angleZ = Math.random() * Math.PI;

		let rotationX = Math.random() * Math.PI;
		let rotationY = Math.random() * Math.PI;
		let rotationZ = Math.random() * Math.PI;

		let scale = Math.random() * (this.Properties.maxSize - this.Properties.minSize) + this.Properties.minSize;
		//180deg
		return new Particle(angleX, angleY, angleZ, 0, scale, rotationX, rotationY, rotationZ, Math.random() * (this.Properties.maxDistance - this.Properties.minDistance) + this.Properties.minDistance);
	}
	protected Opacity: number;
	protected Colors: number[];
	public SetTextureStyle(textureImage: HTMLImageElement, textureCoords: number[]) {
		super.SetTextureStyle(textureImage, textureCoords);
	}
	public SetColorsStyle(colors: number[], opacity: number) {
		super.SetColorsStyle(colors, opacity);
	}
	public get Type(): ParticleType {
		return this._type;
	}
	public set Type(value: ParticleType) {
		this._type = value;
		this.CalculateEdges();
	}
	public get Properties(): ParticlesGeneratorProperties {
		return this.properties;
	}
	public set Properties(value: ParticlesGeneratorProperties) {
		this.properties = value;
	}
	public InitGL() {
		super.InitGL();
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
		let vertices = [];
		let indices = [];
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
		}
		else if (this._type == ParticleType.Sphere) {
			var vert1 = Sphere.CalculateHalfOfSphere(-1, 15);
			vertices = Sphere.CalculateHalfOfSphere(1, 15).concat(vert1);

			let index1 = 0;
			let index2 = this.count;
			let bounds = 0;
			for (let y: number = 0; y <= this.parallelsCount; y += 1) {
				index1 = bounds;
				bounds += this.count;
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

			for (let y: number = 0; y <= this.parallelsCount; y += 1) {
				index1 = bounds;
				bounds += this.count;
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
		}
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
			minSize: 0.01,
			maxSize: 0.1,
			countOnFrame: 20
		}
		this.finished = 0;
		this.generated = 0;

		let colors = [];
		if (this.Type == ParticleType.Sphere) {
			let addColor = (buffer: number[]) => {
				let index: number = 0;
				for (; index < buffer.length; index++) {
					colors.push(buffer[index]);
				}
			};

			let yellow = [
				1, 1, 0,
			];

			let green = [
				0, 1, 0,
			];

			let red = [
				1, 0, 0,
			];

			let pink = [
				1, 0, 1,
			];

			for (let i = 0; i < this.parallelsCount; i++) {
				for (let i2 = 0; i2 < this.count; i2++) {
					if (i < (this.parallelsCount - 1) / 2) {
						addColor(yellow);
					}
					else {
						addColor(green);
					}
				}
			}

			for (let i = 0; i < this.parallelsCount; i++) {
				for (let i2 = 0; i2 < this.count; i2++) {
					if (i < (this.parallelsCount - 1) / 2) {
						addColor(red);
					}
					else {
						addColor(pink);
					}
				}
			}
		}
		else if (this.Type == ParticleType.Cube) {
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
		}
		this.SetColorsStyle(colors, 1);
	}
	public Draw(): void {
		if (this.started) {
			for (let index = 0; index < this.particles.length; index++) {
				let x = Math.cos(this.particles[index].angleX) * this.particles[index].distance;
				let y = Math.sin(this.particles[index].angleY) * this.particles[index].distance;
				let z = Math.sin(this.particles[index].angleZ) * this.particles[index].distance;

				if (isNaN(z)) {
					z = 0;
				}

				let movMatrix = Array.from(this.mov_matrix);

				this.translateX(x);
				this.translateY(y);
				this.translateZ(z);

				this.rotateX(this.particles[index].rotationX);
				this.rotateY(this.particles[index].rotationY);
				this.rotateZ(this.particles[index].rotationZ);

				let scaleValue = 1 - this.particles[index].distance / this.particles[index].distanceMax;

				this.scaleX(this.particles[index].scale * scaleValue);
				this.scaleY(this.particles[index].scale * scaleValue);
				this.scaleZ(this.particles[index].scale * scaleValue);

				this.InitGL();

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

class Svg extends Shape {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	protected Code: string;
	protected Points: DOMPoint[][];
	protected Opacity: number;
	protected Colors: number[];
	public InitGL() {
		super.InitGL();
	}
	public SetTextureStyle(textureImage: HTMLImageElement, textureCoords: number[]) {
		super.SetTextureStyle(textureImage, textureCoords);
	}
	public SetColorsStyle(colors: number[], opacity: number) {
		super.SetColorsStyle(colors, opacity);
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
		let vertices = [];
		let indices = [];

		let parse = ParseSvg(this.Code);
		this.Points = CalculatePolygons(parse);

		let polygonIndex = 0;

		let totalLength = 0;

		for (let index = 0; index < this.Points.length; index++) {
			for (let index2 = 0; index2 < this.Points[index].length; index2++) {
				vertices.push((this.Points[index][index2].x - 1920 / 2) / 500, -(this.Points[index][index2].y - 1080 / 2) / 500, 0);
				if (index2 + 1 < this.Points[index].length) {
					indices.push(index2 + polygonIndex);
					indices.push(index2 + polygonIndex + 1);
				}
			}
			polygonIndex += this.Points[index].length;
		}

		const vertexNormals = [

		];

		this.vertices = vertices;
		this.indices = indices;
	}
	public constructor(svgcode: string) {
		super();
		this.Code = svgcode;
		this.CalculateEdges();
		let colors = [];
		for (let index = 0; index < this.Points.length; index++) {
			for (let index2 = 0; index2 < this.Points[index].length; index2++) {
				colors.push(0, 0, 0);
			}
		}
		this.SetColorsStyle(colors, 1);
	}
	public Draw(): void {
		this.InitGL();

		gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	}
	public clearMatrix() {
		super.clearMatrix();
	}
}

class Cube extends Shape {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	protected Points: DOMPoint[][];
	protected Opacity: number;
	protected Colors: number[];
	public InitGL() {
		super.InitGL();
	}
	public SetTextureStyle(textureImage: HTMLImageElement, textureCoords: number[]) {
		super.SetTextureStyle(textureImage, textureCoords);
	}
	public SetColorsStyle(colors: number[], opacity: number) {
		super.SetColorsStyle(colors, opacity);
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
		let vertices = [
			-1.0, -1.0, 1.0,
			1.0, -1.0, 1.0,
			1.0, 1.0, 1.0,
			-1.0, 1.0, 1.0,

			-1.0, -1.0, -1.0,
			-1.0, 1.0, -1.0,
			1.0, 1.0, -1.0,
			1.0, -1.0, -1.0,

			-1.0, -1.0, -1.0,
			-1.0, -1.0, 1.0,
			-1.0, 1.0, 1.0,
			-1.0, 1.0, -1.0,

			1.0, -1.0, -1.0,
			1.0, 1.0, -1.0,
			1.0, 1.0, 1.0,
			1.0, -1.0, 1.0,

			-1.0, 1.0, -1.0,
			-1.0, 1.0, 1.0,
			1.0, 1.0, 1.0,
			1.0, 1.0, -1.0,
			-1.0, -1.0, -1.0,

			1.0, -1.0, -1.0,
			1.0, -1.0, 1.0,
			-1.0, -1.0, 1.0
		];
		let indices = [
			0, 1, 2, 0, 2, 3,
			4, 5, 6, 4, 6, 7,
			8, 9, 10, 8, 10, 11,
			12, 13, 14, 12, 14, 15,
			16, 17, 18, 16, 18, 19,
			20, 21, 22, 20, 22, 23
		];

		const vertexNormals = [

		];

		this.vertices = vertices;
		this.indices = indices;

		this.InitGL();
	}
	public constructor() {
		super();
		this.CalculateEdges();
		let colors = [
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,
			0, 0, 0,

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
			1, 1, 1
		];
		this.SetColorsStyle(colors, 1);
	}
	public Draw(): void {
		super.Draw();
	}
	public clearMatrix() {
		super.clearMatrix();
	}
}

class InfinitePlane extends Shape {
	protected width: number = 3;
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	protected Points: DOMPoint[][];
	protected Opacity: number;
	protected Colors: number[];
	public InitGL() {
		super.InitGL();
	}
	public SetTextureStyle(textureImage: HTMLImageElement, textureCoords: number[]) {
		super.SetTextureStyle(textureImage, textureCoords);
	}
	public SetColorsStyle(colors: number[], opacity: number) {
		super.SetColorsStyle(colors, opacity);
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
		let y = -1.1;

		this.vertices = [];
		this.indices = [];

		for (let x = 0; x <= this.width * 2; x++) {
			let rX = x - this.width;
			let index = x * 2;
			this.vertices.push(
				rX, y, zoom,
				rX, y, -zDepth,
			);

			this.indices.push(
				index, index + 1
			);
		}

		for (let z = zoom; z >= -zDepth; z--) {
			let index = (this.width * 2 + 1) * 2 + (- z + zoom) * 2;
			this.vertices.push(
				-this.width, y, z,
				this.width, y, z,
			);

			this.indices.push(
				index, index + 1
			);
		}
	}
	public constructor() {
		super();
		this.CalculateEdges();
		let colors = [];
		for (let x = -this.width; x <= this.width; x++) {
			for (let z = 0; z <= zDepth; z++) {
				colors.push(0.5, 0.5, 0.5);
			}
		}
		this.SetColorsStyle(colors, 1);
	}
	public Draw(): void {
		this.InitGL();

		gl.drawElements(gl.LINES, this.indices.length, gl.UNSIGNED_SHORT, 0);
	}
	public clearMatrix() {
		super.clearMatrix();
	}
}

var currentShape: Shape;
var currentShapeIndex = 0;

var webGlShaderProgram = null;

var Shapes: Shape[] = [];

const zoom = 3;

const distBetweenCubes = 6;

const id = "cnvs";

const glVersion = "webgl";

var gl: WebGLRenderingContext = null;

var zDepth = 30;

const defaultDelta = 3;

var rotation = {
	deltaX: 0,
	rotateT: 0,
	rotationEnded: true,
	scaled: false,
	mouseDown: new DOMPoint()
};

const zWidth = 30;

var translation = {
	translateZ: 0,
	translateZDelta: 0,
	translateT: 0,

}

var startTick = Date.now();
var fps = 0;

enum EasingType {
	arc, linear, quad
}

window.onload = StartApp;

function EasingFunction(t: number, type: EasingType, concomitantParam: number[]): number {
	if (type == EasingType.arc) {
		let x = -(1 - t);
		let y = Math.sin(Math.acos(x));
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
	gl.clearColor(207 / 255, 207 / 255, 207 / 255, 1);
	gl.clearDepth(1.0);

	gl.viewport(0.0, 0.0, gl.canvas.width, gl.canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	Rotate();
	Translate();
	for (let index = 0; index < Shapes.length; index++) {
		Shapes[index].Draw();
	}

	requestAnimationFrame(DrawScene);
	fps++;

	if (Date.now() - startTick > 1000) {
		document.getElementById("approve").innerHTML = fps.toString();
		fps = 0;
		startTick = Date.now();
	}
}

function Rotate() {
	let param = [];
	let easing = EasingType.arc;
	if (rotation.rotateT < 90 && rotation.deltaX != 0) {
		if (rotation.deltaX != 0) {
			currentShape.rotateY(-rotation.deltaX / Math.abs(rotation.deltaX) / 2 * Math.PI * EasingFunction(rotation.rotateT / 90, easing, param));
		}
		rotation.rotateT += defaultDelta;
		if (rotation.deltaX != 0) {
			currentShape.rotateY(rotation.deltaX / Math.abs(rotation.deltaX) / 2 * Math.PI * EasingFunction(rotation.rotateT / 90, easing, param));
		}
	}
	else {
		rotation.rotationEnded = true;
		rotation.deltaX = 0;
		rotation.rotateT = 0;
	}
}

function Translate() {
	let type = EasingType.quad;
	if (translation.translateZDelta != 0) {
		if (Math.abs(translation.translateZ) < zWidth) {
			for (let index = 0; index < Shapes.length; index++) {
				Shapes[index].translateZ(-translation.translateZ / zWidth * distBetweenCubes * EasingFunction(translation.translateT, type, []));
			}
			translation.translateZ += translation.translateZDelta;
			translation.translateT = Math.abs(translation.translateZ) / zWidth;
			for (let index = 0; index < Shapes.length; index++) {
				Shapes[index].translateZ(translation.translateZ / zWidth * distBetweenCubes * EasingFunction(translation.translateT, type, []));
			}
		}
		else {
			translation.translateZDelta = 0;
			translation.translateZ = 0;
			translation.translateT = 0;
		}
	}
}

function InitShapes() {
	let cube1 = new Cube();
	let cube2 = new Cube();
	let sphere = new Sphere();
	let text = new Svg(content);
	let plane = new InfinitePlane();
	currentShape = text;
	cube1.translateZ(-distBetweenCubes - 1);
	cube2.translateZ(-2 * distBetweenCubes - 1);
	sphere.translateZ(-3 * distBetweenCubes - 1);

	Shapes.push(text);
	Shapes.push(cube1);
	Shapes.push(cube2);
	Shapes.push(sphere);
	Shapes.push(plane);
}

function InitTextures() {
	let nknwnStand = new Image();
	nknwnStand.src = "Resources/nknwn_ndfnd_min.png";
	nknwnStand.decode();
	nknwnStand.onload = function () {
		Shapes[1].SetTextureStyle(nknwnStand, [
			// Front			
			1 / 2, 0,
			1, 0,
			1, 1 / 2,
			1 / 2, 1 / 2,
			// Back	
			1 / 2, 1 / 2,
			1, 1 / 2,
			1, 1,
			1 / 2, 1,
			// Right	
			0, 1 / 2,
			1 / 2, 1 / 2,
			1 / 2, 1,
			0, 1,
			// Left		
			0, 0,
			1 / 2, 0,
			1 / 2, 1 / 2,
			0, 1 / 2
		]);
		Shapes[2].SetTextureStyle(nknwnStand, [
			// Front			
			1 / 2, 0,
			1, 0,
			1, 1 / 2,
			1 / 2, 1 / 2,
			// Back	
			1 / 2, 1 / 2,
			1, 1 / 2,
			1, 1,
			1 / 2, 1,
			// Right	
			0, 1 / 2,
			1 / 2, 1 / 2,
			1 / 2, 1,
			0, 1,
			// Left		
			0, 0,
			1 / 2, 0,
			1 / 2, 1 / 2,
			0, 1 / 2
		]);
	};
	let returnImg = new Image();
	returnImg.src = "Resources/return.png";
	returnImg.decode();
	let returnPositions: number[] = [];
	var quality = (<Sphere>Shapes[3]).Quality;
	for (let angleRelativeY: number = 0; angleRelativeY < quality; angleRelativeY += 1) {
		let absoluteY = Math.sin((angleRelativeY / (quality - 1) * Math.PI) + Math.PI / 2);
		let xStart = -Math.sqrt(1 - Math.pow(absoluteY, 2));
		let radius = -xStart;
		for (let angleRelativeX: number = 0; angleRelativeX < quality; angleRelativeX += 1) {
			let absoluteX = Math.cos((angleRelativeX) / (quality - 1) * Math.PI) * radius;
			returnPositions.push((absoluteX + 1) / 2);
			returnPositions.push((absoluteY + 1) / 2);
		}
	}
	returnImg.onload = () => {
		Shapes[3].SetTextureStyle(returnImg, returnPositions);
	}
}

function StartApp() {
	gl = (<HTMLCanvasElement>document.getElementById(id)).getContext(glVersion);
	Resize();
	InitShapes();
	InitTextures();
	DrawScene();
	BindEvents();
}

function BindEvents() {
	var cnvs = document.getElementById(id);
	cnvs.onmousedown = MouseDown;
	cnvs.onmouseup = MouseUp;
	cnvs.onwheel = MouseWheel;
	window.onresize = () => {
		Resize();
	}
}

function MouseDown(ev: MouseEvent) {
	if (!rotation.rotationEnded) {
		return;
	}
	rotation.mouseDown.x = ev.pageX;
	rotation.mouseDown.y = ev.pageY;
}

function MouseUp(ev: MouseEvent) {
	if (!rotation.rotationEnded) {
		return;
	}
	if (rotation.mouseDown.x == ev.pageX && rotation.mouseDown.y == ev.pageY) {
		return;
	}
	if (Math.abs(ev.pageX - rotation.mouseDown.x) > Math.abs(ev.pageY - rotation.mouseDown.y)) {
		if (ev.pageX - rotation.mouseDown.x < 0) {
			rotation.deltaX = -defaultDelta;
			rotation.rotationEnded = false;
		}
		else {
			rotation.deltaX = defaultDelta;
			rotation.rotationEnded = false;
		}
	}
}

function MouseWheel(ev: WheelEvent) {
	let rotationEnded = !(rotation.rotateT < 90 && rotation.deltaX != 0);
	let translationEnded = currentShapeIndex + Math.floor(ev.deltaY / Math.abs(ev.deltaY)) >= 0 && currentShapeIndex + Math.floor(ev.deltaY / Math.abs(ev.deltaY)) < Shapes.length-1 && translation.translateZDelta == 0;
	if (translationEnded && rotationEnded) {
		translation.translateZDelta = ev.deltaY / Math.abs(ev.deltaY) * 1;
		if (translation.translateZDelta < 0) {
			currentShapeIndex--;
		}
		else if (translation.translateZDelta > 0) {
			currentShapeIndex++;
		}
		currentShape = Shapes[currentShapeIndex];
		console.log(currentShapeIndex);
	}
}

function Resize() {
	let cnvs = document.getElementById(id);
	cnvs.setAttribute("width", (innerWidth).toString());
	cnvs.setAttribute("height", (innerHeight).toString());
}

function transposeMat4(matrix: number[]): number[] {
	let newMatrix = [
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0
	];
	for (let index = 0; index < matrix.length; index++) {
		let col = index % 4;
		let row = Math.floor(index / 4);
		let newIndex = col * 4 + row;
		newMatrix[newIndex] = matrix[index];
	}
	return newMatrix;
}

function inverseMat4(matrix: number[]): number[] {
	let newMatrix = [
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, 0, 0
	];
	return newMatrix;
}