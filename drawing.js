var mov_matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
var accuracy = 3.5;
window.onload = function () {
    InitSimpleShape();
    document.getElementById("approve").onclick = function () {
        accuracy = parseInt(document.getElementById("anglesCount").value) / 2;
    };
};
function Circle(angle, r) {
    return new DOMPoint(Math.cos(angle) * r, Math.sin(angle) * r);
}
function InitSimpleShape() {
    var zoom = 6;
    var gl = document.getElementById("cnvs").getContext("webgl");
    //cube
    //var vertices = [
    //	-1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
    //	-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
    //	-1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1,
    //	1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1,
    //	-1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, -1,
    //	-1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, -1,
    //];
    var vertices = [];
    var r = 1;
    for (var angle = 0; angle < accuracy * 2; angle += 1) {
        var radians = (angle / accuracy) * Math.PI;
        var p1 = Circle(radians, r);
        var p2 = Circle(radians + Math.PI / accuracy, r);
        var x = p1.x;
        var y = p1.y;
        var x2 = p2.x;
        var y2 = p2.y;
        vertices.push(x, y, -1);
        vertices.push(x2, y2, -1);
        vertices.push(x2, y2, 1);
        vertices.push(x, y, 1);
    }
    vertices.push(0, 0, 1);
    for (var angle = 0; angle < accuracy * 2; angle += 1) {
        var radians = (angle / accuracy) * Math.PI;
        var p1 = Circle(radians, r);
        var p2 = Circle(radians + Math.PI / accuracy, r);
        var x = p1.x;
        var y = p1.y;
        var x2 = p2.x;
        var y2 = p2.y;
        vertices.push(x2, y2, 1);
        vertices.push(x, y, 1);
    }
    vertices.push(1, 1, -1);
    for (var angle = 0; angle < accuracy * 2; angle += 1) {
        var radians = (angle / accuracy) * Math.PI;
        var p1 = Circle(radians, r);
        var p2 = Circle(radians + Math.PI / accuracy, r);
        var x = p1.x;
        var y = p1.y;
        var x2 = p2.x;
        var y2 = p2.y;
        vertices.push(x2, y2, -1);
        vertices.push(x, y, -1);
    }
    var colors = [
        5, 3, 7, 5, 3, 7, 5, 3, 7, 5, 3, 7,
        1, 1, 3, 1, 1, 3, 1, 1, 3, 1, 1, 3,
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0
    ];
    //var indices = [
    //	0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7,
    //	8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15,
    //	16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
    //];
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
    //for (let index = accuracy * 2 * 4 + accuracy * 2 * 2; index < accuracy * 2 * 4 + accuracy * 2 * 2 + accuracy * 2 * 2; index += 2) {
    //	indices.push(accuracy * 2 * 4 + accuracy * 2 * 2);
    //	indices.push(index + 1);
    //	indices.push(index + 2);
    //}
    // Create and store data into vertex buffer
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
    var vertCode = 'attribute vec3 position;' +
        'uniform mat4 Pmatrix;' +
        'uniform mat4 Vmatrix;' +
        'uniform mat4 Mmatrix;' +
        'attribute vec3 color;' + //the color of the point
        'varying vec3 vColor;' +
        'void main(void) { ' + //pre-built function
        'gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);' +
        'vColor = color;' +
        '}';
    var fragCode = 'precision mediump float;' +
        'varying vec3 vColor;' +
        'void main(void) {' +
        'gl_FragColor = vec4(vColor, 1.);' +
        '}';
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
    /*================= Drawing ===========================*/
    var animate = function (time) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clearColor(0.5, 0.5, 0.5, 1);
        gl.clearDepth(1.0);
        gl.viewport(0.0, 0.0, gl.canvas.width, gl.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        for (var i = 0; i < 1; i++) {
            translateZ(mov_matrix, -i * 5);
            gl.uniformMatrix4fv(Pmatrix, false, proj_matrix);
            gl.uniformMatrix4fv(Vmatrix, false, view_matrix);
            gl.uniformMatrix4fv(Mmatrix, false, mov_matrix);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
            if (deltaX < 0 && currentAngleX + deltaX >= angleX) {
                currentAngleX += deltaX;
                rotateY(mov_matrix, deltaX / 180 * Math.PI);
            }
            else if (deltaX > 0 && currentAngleX + deltaX <= angleX) {
                currentAngleX += deltaX;
                rotateY(mov_matrix, deltaX / 180 * Math.PI);
            }
            else if (deltaY < 0 && currentAngleY + deltaY >= angleY) {
                currentAngleY += deltaY;
                if (currentAngleY < angleY) {
                    deltaY = angleY - currentAngleY - deltaY;
                }
                rotateX(mov_matrix, deltaY / 180 * Math.PI);
            }
            else if (deltaY > 0 && currentAngleY + deltaY <= angleY) {
                currentAngleY += deltaY;
                if (currentAngleY > angleY) {
                    deltaY = angleY - currentAngleY - deltaY;
                }
                rotateX(mov_matrix, deltaY / 180 * Math.PI);
            }
            else {
                rotationEnded = true;
                currentAngleX = angleX;
                currentAngleY = angleY;
                deltaX = 0;
                deltaY = 0;
            }
        }
        window.requestAnimationFrame(InitSimpleShape);
        mov_matrix[14] = -zoom;
        mov_matrix[12] = 0;
    };
    animate(0);
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
}
function scaleY(m, value) {
    m[5] *= value;
}
function scaleZ(m, value) {
    m[10] *= value;
}
var currentAngleX = 0;
var angleX = 0;
var currentAngleY = 0;
var angleY = 0;
var defaultDelta = 3;
var deltaX = 0;
var deltaY = 0;
var rotationEnded = true;
var mouseDown = new DOMPoint();
document.onmousedown = function (ev) {
    if (!rotationEnded) {
        return;
    }
    mouseDown.x = ev.pageX;
    mouseDown.y = ev.pageY;
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
            angleX -= 90;
            deltaX = -defaultDelta;
            rotationEnded = false;
        }
        else {
            angleX += 90;
            deltaX = defaultDelta;
            rotationEnded = false;
        }
    }
    else {
        if (ev.pageY - mouseDown.y < 0) {
            angleY -= 90;
            deltaY = -defaultDelta;
            rotationEnded = false;
        }
        else {
            angleY += 90;
            deltaY = defaultDelta;
            rotationEnded = false;
        }
    }
};
//# sourceMappingURL=drawing.js.map