var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Shape = /** @class */ (function () {
    function Shape() {
        this.mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        this.Visible = true;
        this.Opacity = 1;
        this.CalculateEdges();
    }
    Shape.prototype.InitGL = function (vertices, colors, indices) {
        var gl = document.getElementById("cnvs").getContext("webgl");
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
        var vertCode = "attribute vec3 position;\n\t\tuniform mat4 Pmatrix;\n\t\tuniform mat4 Vmatrix;\n\t\tuniform mat4 Mmatrix;\n\t\tattribute vec3 color;\n\t\tvarying vec3 vColor;\n\n\t\tvoid main(void) {\n\t\tgl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n\t\tvColor = color;\n\t\t}";
        var fragCode = "precision mediump float;\n\t\tvarying vec3 vColor;\n\t\tvoid main(void) {\n\t\tgl_FragColor = vec4(vColor, " + this.Opacity + ");\n\t\t}";
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
            var ang = Math.tan((angle * .5) * Math.PI / 180); //angle*.5
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
    };
    Shape.prototype.CalculateEdges = function () {
    };
    Shape.prototype.Draw = function () {
    };
    Shape.prototype.rotateZ = function (angle) {
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
    };
    Shape.prototype.rotateX = function (angle) {
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
    };
    Shape.prototype.rotateY = function (angle) {
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
    };
    Shape.prototype.translateX = function (offset) {
        var m = this.mov_matrix;
        m[12] += offset;
    };
    Shape.prototype.translateY = function (offset) {
        var m = this.mov_matrix;
        m[13] += offset;
    };
    Shape.prototype.translateZ = function (offset) {
        var m = this.mov_matrix;
        m[14] += offset;
    };
    Shape.prototype.scaleX = function (value) {
        var m = this.mov_matrix;
        m[0] *= value;
        m[1] *= value;
        m[2] *= value;
    };
    Shape.prototype.scaleY = function (value) {
        var m = this.mov_matrix;
        m[4] *= value;
        m[5] *= value;
        m[6] *= value;
    };
    Shape.prototype.scaleZ = function (value) {
        var m = this.mov_matrix;
        m[10] *= value;
        m[9] *= value;
        m[8] *= value;
    };
    return Shape;
}());
var Circle = /** @class */ (function (_super) {
    __extends(Circle, _super);
    function Circle() {
        return _super.call(this) || this;
    }
    Circle.prototype.InitGL = function (vertices, colors, indices) {
        _super.prototype.InitGL.call(this, vertices, colors, indices);
    };
    Circle.prototype.rotateZ = function (angle) {
        _super.prototype.rotateZ.call(this, angle);
    };
    Circle.prototype.rotateX = function (angle) {
        _super.prototype.rotateX.call(this, angle);
    };
    Circle.prototype.rotateY = function (angle) {
        _super.prototype.rotateY.call(this, angle);
    };
    Circle.prototype.translateX = function (offset) {
        _super.prototype.translateX.call(this, offset);
    };
    Circle.prototype.translateY = function (offset) {
        _super.prototype.translateY.call(this, offset);
    };
    Circle.prototype.translateZ = function (offset) {
        _super.prototype.translateZ.call(this, offset);
    };
    Circle.prototype.scaleX = function (value) {
        _super.prototype.scaleX.call(this, value);
    };
    Circle.prototype.scaleY = function (value) {
        _super.prototype.scaleX.call(this, value);
    };
    Circle.prototype.scaleZ = function (value) {
        _super.prototype.scaleX.call(this, value);
    };
    Circle.prototype.CalculateEdges = function () {
        var gl = document.getElementById(id).getContext("webgl");
        var vertices = [];
        var colors = [];
        var indices = [];
        var parallelsCount = 50;
        var count = 100;
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
        var addColor = function (buffer) {
            var index = 0;
            for (; index < buffer.length; index++) {
                colors.push(buffer[index]);
            }
        };
        for (var y = 0; y <= parallelsCount; y += 1) {
            var absoluteY = (y - parallelsCount / 2) / (parallelsCount / 2);
            var xStart = -Math.sqrt(1 - Math.pow(absoluteY, 2));
            var radius = -xStart;
            for (var x = 0; x < count; x += 1) {
                var absoluteX = (x) / (count - 1) * 2 * radius + xStart;
                var z = Math.sin(Math.acos(absoluteX / radius)) * radius;
                if (isNaN(z)) {
                    z = 0;
                }
                vertices.push(absoluteX, absoluteY, z);
                if (y < parallelsCount / 2) {
                    addColor(yellow);
                }
                else {
                    addColor(green);
                }
            }
        }
        for (var y = 0; y <= parallelsCount; y += 1) {
            var absoluteY = (y - parallelsCount / 2) / (parallelsCount / 2);
            var xStart = -Math.sqrt(1 - Math.pow(absoluteY, 2));
            var radius = -xStart;
            for (var x = 0; x < count; x += 1) {
                var absoluteX = (x) / (count - 1) * 2 * radius + xStart;
                var z = Math.sin(Math.acos(absoluteX / radius)) * radius;
                if (isNaN(z)) {
                    z = 0;
                }
                vertices.push(absoluteX, absoluteY, -z);
                if (y < parallelsCount / 2) {
                    addColor(red);
                }
                else {
                    addColor(pink);
                }
            }
        }
        var index1 = 0;
        var index2 = count;
        var bounds = 0;
        for (var y = 0; y <= parallelsCount; y += 1) {
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
        for (var y = 0; y <= parallelsCount; y += 1) {
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
        var vertexNormals = [];
        this.vertices = vertices;
        this.indices = indices;
        this.Colors = colors;
        this.mov_matrix[14] = -zoom;
    };
    Circle.prototype.Draw = function () {
        var gl = document.getElementById(id).getContext("webgl");
        this.InitGL(this.vertices, this.Colors, this.indices);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    };
    return Circle;
}(Shape));
var RegularPolygon = /** @class */ (function (_super) {
    __extends(RegularPolygon, _super);
    function RegularPolygon() {
        var _this = _super.call(this) || this;
        _this.N = 4;
        _this.CalculateEdges();
        return _this;
    }
    RegularPolygon.prototype.Circle = function (angle, r) {
        return new DOMPoint(Math.cos(angle) * r, Math.sin(angle) * r);
    };
    RegularPolygon.prototype.InitGL = function (vertices, colors, indices) {
        _super.prototype.InitGL.call(this, vertices, colors, indices);
    };
    RegularPolygon.prototype.rotateZ = function (angle) {
        _super.prototype.rotateZ.call(this, angle);
    };
    RegularPolygon.prototype.rotateX = function (angle) {
        _super.prototype.rotateX.call(this, angle);
    };
    RegularPolygon.prototype.rotateY = function (angle) {
        _super.prototype.rotateY.call(this, angle);
    };
    RegularPolygon.prototype.translateX = function (offset) {
        _super.prototype.translateX.call(this, offset);
    };
    RegularPolygon.prototype.translateY = function (offset) {
        _super.prototype.translateY.call(this, offset);
    };
    RegularPolygon.prototype.translateZ = function (offset) {
        _super.prototype.translateZ.call(this, offset);
    };
    RegularPolygon.prototype.scaleX = function (value) {
        _super.prototype.scaleX.call(this, value);
    };
    RegularPolygon.prototype.scaleY = function (value) {
        _super.prototype.scaleX.call(this, value);
    };
    RegularPolygon.prototype.scaleZ = function (value) {
        _super.prototype.scaleX.call(this, value);
    };
    RegularPolygon.prototype.CalculateEdges = function () {
        var gl = document.getElementById("cnvs").getContext("webgl");
        var accuracy = this.N / 2;
        var vertices = [];
        var colors = [];
        var r = 1;
        var vertexNormals = [];
        for (var angle = 0; angle < accuracy * 2; angle += 1) {
            var radians = (angle / accuracy) * Math.PI;
            var p1 = this.Circle(radians, r);
            var p2 = this.Circle(radians + Math.PI / accuracy, r);
            var x = p1.x;
            var y = p1.y;
            var x2 = p2.x;
            var y2 = p2.y;
            for (var i = 0; i < c1.length * 4; i++) {
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
        for (var i = 0; i < c2.length; i++) {
            colors.push(c2[i % 3]);
        }
        for (var angle = 0; angle < accuracy * 2; angle += 1) {
            var radians = (angle / accuracy) * Math.PI;
            var p1 = this.Circle(radians, r);
            var p2 = this.Circle(radians + Math.PI / accuracy, r);
            var x = p1.x;
            var y = p1.y;
            var x2 = p2.x;
            var y2 = p2.y;
            for (var i = 0; i < c2.length * 2; i++) {
                colors.push(c2[i % 3]);
            }
            vertices.push(x2, y2, 1);
            vertices.push(x, y, 1);
        }
        vertices.push(0, 0, -1);
        for (var i = 0; i < c3.length; i++) {
            colors.push(c3[i % 3]);
        }
        for (var angle = 0; angle < accuracy * 2; angle += 1) {
            var radians = (angle / accuracy) * Math.PI;
            var p1 = this.Circle(radians, r);
            var p2 = this.Circle(radians + Math.PI / accuracy, r);
            var x = p1.x;
            var y = p1.y;
            var x2 = p2.x;
            var y2 = p2.y;
            for (var i = 0; i < c3.length * 2; i++) {
                colors.push(c3[i % 3]);
            }
            vertices.push(x2, y2, -1);
            vertices.push(x, y, -1);
        }
        var indices = [];
        for (var index = 0; index < accuracy * 2 * 4; index += 4) {
            indices.push(index);
            indices.push(index + 1);
            indices.push(index + 2);
            indices.push(index + 0);
            indices.push(index + 2);
            indices.push(index + 3);
        }
        for (var index = accuracy * 2 * 4; index < accuracy * 2 * 4 + accuracy * 2 * 2; index += 2) {
            indices.push(accuracy * 2 * 4);
            indices.push(index + 1);
            indices.push(index + 2);
        }
        for (var index = accuracy * 2 * 4 + accuracy * 2 * 2 + 1; index < accuracy * 2 * 4 + accuracy * 2 * 2 + accuracy * 2 * 2; index += 2) {
            indices.push(accuracy * 2 * 4 + accuracy * 2 * 2 + 1);
            indices.push(index + 1);
            indices.push(index + 2);
        }
        this.vertices = vertices;
        this.indices = indices;
        this.Colors = colors;
        this.mov_matrix[14] = -zoom;
    };
    RegularPolygon.prototype.Draw = function () {
        var gl = document.getElementById(id).getContext("webgl");
        this.InitGL(this.vertices, this.Colors, this.indices);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    };
    return RegularPolygon;
}(Shape));
var mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var c1 = [0, 0, 0];
var c2 = [1, 0, 0];
var c3 = [1, 1, 0];
var currentShape;
var Shapes;
var zoom = 10;
var id = "cnvs";
var EasingType;
(function (EasingType) {
    EasingType[EasingType["arc"] = 0] = "arc";
    EasingType[EasingType["linear"] = 1] = "linear";
    EasingType[EasingType["quad"] = 2] = "quad";
})(EasingType || (EasingType = {}));
function EasingFunction(t, type, concomitantParam) {
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
    var gl = document.getElementById("cnvs").getContext("webgl");
    gl.clearColor(0.5, 0.5, 0.5, 1);
    gl.clearDepth(1.0);
    gl.viewport(0.0, 0.0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    Rotate();
    for (var index = 0; index < Shapes.length; index++) {
        Shapes[index].Draw();
    }
    requestAnimationFrame(DrawScene);
}
function Rotate() {
    var param = [];
    var easing = EasingType.quad;
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
var defaultDelta = 3;
var deltaX = 0;
var deltaY = 0;
var rotateT = 0;
var rotationEnded = true;
var scaled = false;
var mouseDown = new DOMPoint();
window.onload = function () {
    document.getElementById("approve").onclick = function () {
        //accuracy = parseInt((<HTMLInputElement>document.getElementById("anglesCount")).value) / 2;
    };
    window.onresize(new UIEvent("resize"));
    currentShape = new RegularPolygon();
    Shapes.push(currentShape);
    DrawScene();
};
document.onmousedown = function (ev) {
    if (!rotationEnded) {
        return;
    }
    mouseDown.x = ev.pageX;
    mouseDown.y = ev.pageY;
};
document.onwheel = function (ev) {
    var value = ev.deltaY / Math.abs(ev.deltaY) * 0.1 + 1;
    currentShape.scaleX(value);
    currentShape.scaleY(value);
    currentShape.scaleZ(value);
};
window.onresize = function (ev) {
    var cnvs = document.getElementById("cnvs");
    cnvs.setAttribute("width", (innerWidth).toString());
    cnvs.setAttribute("height", (innerHeight).toString());
};
document.onmouseup = function (ev) {
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
};
function transposeMat4(matrix) {
    var newMatrix = [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ];
    for (var index = 0; index < matrix.length; index++) {
        var col = index % 4;
        var row = Math.floor(index / 4);
        var newIndex = col * 4 + row;
        newMatrix[newIndex] = matrix[index];
    }
    return newMatrix;
}
function inverseMat4(matrix) {
    var newMatrix = [
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0,
        0, 0, 0, 0
    ];
    return newMatrix;
}
//# sourceMappingURL=drawing.js.map