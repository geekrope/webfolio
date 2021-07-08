/// <reference path="rasterizesvg.ts" />
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
		let angle = 70;
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

			let proj_matrix = get_projection(angle, gl.canvas.width / gl.canvas.height, 1, zDepth);

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

			//shaders code

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

			//create shaders

			let vertShader = gl.createShader(gl.VERTEX_SHADER);
			gl.shaderSource(vertShader, vertCode);
			gl.compileShader(vertShader);

			let fragShader = gl.createShader(gl.FRAGMENT_SHADER);
			gl.shaderSource(fragShader, fragCode);
			gl.compileShader(fragShader);

			//create shader program

			let shaderProgram = gl.createProgram();
			gl.attachShader(shaderProgram, vertShader);
			gl.attachShader(shaderProgram, fragShader);
			gl.linkProgram(shaderProgram);

			//create texture

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

			//matrixes

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

			let proj_matrix = get_projection(angle, gl.canvas.width / gl.canvas.height, 1, zDepth);

			let view_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

			gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
			gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
			gl.uniformMatrix4fv(Mmatrix, false, this.mov_matrix);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);

			//other

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

class Svg extends Shape {
	protected mov_matrix: number[];
	protected vertices: number[];
	protected indices: number[];
	protected Code: string;
	protected Points: DOMPoint[][];
	protected Opacity: number;
	protected Colors: number[];
	public svgWidth: number = 0;
	public svgHeight: number = 0;
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

		const scaleDown = 500;

		for (let index = 0; index < this.Points.length; index++) {
			for (let index2 = 0; index2 < this.Points[index].length; index2++) {
				vertices.push((this.Points[index][index2].x - this.svgWidth / 2) / scaleDown, -(this.Points[index][index2].y - this.svgHeight / 2) / scaleDown, 0);
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
	public constructor(svgcode: string, width, height) {
		super();
		this.svgWidth = width;
		this.svgHeight = height;
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
	public References: string[];
	public SideIndex: number;
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
		this.SideIndex = 0;
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

var showFps: boolean = false;

const zoom = 3;

const distBetweenCubes = 6;

const id = "cnvs";

const glVersion = "webgl";

const standsCount = 4;

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

var translation = {
	translateTarget: 0,
	translateStart: 0,
	translateFrame: 0,
	translateFrames: 30,
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
		if (showFps) {
			console.log(fps);
		}
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
	if (translation.translateStart != translation.translateTarget) {
		var zTransltaionLast = translation.translateStart + (translation.translateTarget - translation.translateStart) *
			EasingFunction(translation.translateFrame / translation.translateFrames, type, []);

		if (isNaN(zTransltaionLast)) {
			zTransltaionLast = 0;
		}

		translation.translateFrame++;

		var zTransltaionCurrent = translation.translateStart + (translation.translateTarget - translation.translateStart) *
			EasingFunction(translation.translateFrame / translation.translateFrames, type, []);

		if (isNaN(zTransltaionCurrent)) {
			zTransltaionCurrent = 0;
		}

		Shapes.forEach((value: Shape, index: number, array: Shape[]) => { value.translateZ(zTransltaionCurrent - zTransltaionLast); });

		if (translation.translateFrame == translation.translateFrames) {
			translation.translateStart = translation.translateTarget;
			translation.translateFrame = 0;
			translation.translateT = 0;
		}
	}
}

function InitShapes() {
	let cube1 = new Cube();
	let cube2 = new Cube();
	let sphere = new Sphere();
	let text = new Svg(content, 1920, 1080);
	let plane = new InfinitePlane();
	currentShape = text;
	cube1.translateZ(-distBetweenCubes - 1);
	cube2.translateZ(-2 * distBetweenCubes - 1);
	sphere.translateZ(-3 * distBetweenCubes - 1);

	text.scaleX(1.5);
	text.scaleY(1.5);

	cube1.References = [
		"https://github.com/geekrope",
		"https://github.com/geekrope/SvgEdtitor",
		"https://github.com/geekrope/TetrisRemake",
		"https://github.com/geekrope/2048"
	];
	cube2.References = [
		"https://www.behance.net/damirr765dcd7",
		"https://www.behance.net/gallery/122634587/GUCCI-%282021%29-website-redesign",
		"https://www.behance.net/gallery/119202149/BMX-haro",
		"https://www.behance.net/gallery/119305933/Alfa-Bank"
	];

	Shapes.push(text);
	Shapes.push(cube1);
	Shapes.push(cube2);
	Shapes.push(sphere);
	Shapes.push(plane);
}

function InitTextures() {
	let coords = [
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
	];

	let nknwnStand = new Image();
	nknwnStand.src = "Resources/nknwn_ndfnd_min.png";
	nknwnStand.decode();
	nknwnStand.onload = function () {
		Shapes[1].SetTextureStyle(nknwnStand, coords);
	};

	let damirStand = new Image();
	damirStand.src = "Resources/damir_min.png";
	damirStand.decode();
	damirStand.onload = function () {
		Shapes[2].SetTextureStyle(damirStand, coords);
	};

	let returnImg = new Image();
	returnImg.src = "Resources/emoji.png";
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
		Shapes[3].SetTextureStyle(returnImg, returnPositions.concat(returnPositions));
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
	if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
		|| /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
		cnvs.ontouchstart = TouchStart;
		cnvs.ontouchmove = TouchMove;
	}
	else {
		cnvs.onmousedown = MouseDown;
		cnvs.onmouseup = MouseUp;
		cnvs.onwheel = MouseWheel;
	}
	window.onresize = () => {
		Resize();
	}
}

function MouseDown(ev: MouseEvent) {
	if (rotation.rotationEnded) {
		rotation.mouseDown.x = ev.pageX;
		rotation.mouseDown.y = ev.pageY;
	}
}

function MouseUp(ev: MouseEvent) {
	if (!(rotation.mouseDown.x == ev.pageX && rotation.mouseDown.y == ev.pageY) && rotation.rotationEnded) {
		if (Math.abs(ev.pageX - rotation.mouseDown.x) > Math.abs(ev.pageY - rotation.mouseDown.y)) {
			if (ev.pageX - rotation.mouseDown.x < 0) {
				RotateCurrentShape(-1);
			}
			else {
				RotateCurrentShape(1);
			}
		}
	}
}

function GetCurrentReference(cube: Cube) {
	var index = 0;
	if (cube.SideIndex < 0) {
		index = cube.References.length - Math.abs(cube.SideIndex % cube.References.length);
	}
	else {
		index = Math.abs(cube.SideIndex % cube.References.length);
	}
	(<HTMLLinkElement>document.getElementById("reference")).href = cube.References[index];
}

function ClearLink() {
	(<HTMLLinkElement>document.getElementById("reference")).href = "javascript:void(0);";
}

function MouseWheel(ev: WheelEvent) {
	var direction = Math.round(ev.deltaY / Math.abs(ev.deltaY));
	TranslateShapes(direction);
}

function TranslateShapes(direction: number) {
	let rotationEnded = rotation.rotationEnded;
	if (rotationEnded && translation.translateStart == translation.translateTarget) {
		var target = translation.translateStart + direction * distBetweenCubes;
		if (currentShapeIndex + direction >= 0 && currentShapeIndex + direction < standsCount) {
			currentShapeIndex += direction;
		}
		else if (currentShapeIndex + direction < 0) {
			currentShapeIndex = standsCount - 1;
			target = currentShapeIndex * distBetweenCubes;
		}
		else if (currentShapeIndex + direction >= standsCount) {
			currentShapeIndex = 0;
			target = 0;
		}
		translation.translateTarget = target;

		translation.translateFrame = 0;

		currentShape = Shapes[currentShapeIndex];

		if (currentShape instanceof Cube) {
			GetCurrentReference(currentShape);
		}
		else {
			ClearLink();
		}
	}
}

function RotateCurrentShape(direction: number) {
	rotation.deltaX = Math.sign(direction) * defaultDelta;
	rotation.rotationEnded = false;
	if (currentShape instanceof Cube) {
		currentShape.SideIndex++;
		GetCurrentReference(currentShape);
	}
}

function TouchStart(ev: TouchEvent) {
	if (!rotation.rotationEnded) {
		return;
	}
	rotation.mouseDown.x = ev.touches[0].clientX;
	rotation.mouseDown.y = ev.touches[0].clientY;
}

function TouchMove(ev: TouchEvent) {
	var x = ev.touches[0].clientX;
	var y = ev.touches[0].clientY;
	if (!(rotation.mouseDown.x == x && rotation.mouseDown.y == y) && rotation.rotationEnded) {
		if (Math.abs(x - rotation.mouseDown.x) > Math.abs(y - rotation.mouseDown.y)) {
			if (x - rotation.mouseDown.x < 0) {
				RotateCurrentShape(-1);
			}
			else {
				RotateCurrentShape(1);
			}
		}
		else {
			if (y - rotation.mouseDown.y < 0) {
				TranslateShapes(-1);
			}
			else {
				TranslateShapes(1);
			}
		}
	}
}

function Resize() {
	let cnvs = document.getElementById(id);
	cnvs.setAttribute("width", (innerWidth).toString());
	cnvs.setAttribute("height", (innerHeight).toString());
}
