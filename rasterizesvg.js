class Attribute {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}
function ParseSvg(src) {
    let attrs = [];
    let openTag = "<path";
    let closeTag = "/>";
    let pathIndex = 0;
    for (;;) {
        let ind1 = src.indexOf(openTag);
        let ind2 = src.indexOf(closeTag);
        if (ind1 == -1 || ind2 == -1) {
            break;
        }
        let content = src.substring(ind1 + openTag.length, ind2);
        src = src.replace(openTag + content + closeTag, "");
        content = content.toLowerCase();
        let split = content.split(`"`);
        attrs.push(new Array());
        for (let index = 0; index < split.length; index += 2) {
            if (split[index] == "") {
                split.splice(index);
                index--;
            }
            else {
                let name = split[index].replace("=", "");
                for (; name.indexOf(" ") != -1;) {
                    name = name.replace(" ", "");
                }
                let value = split[index + 1];
                attrs[pathIndex].push(new Attribute(name, value));
            }
        }
        pathIndex++;
    }
    return attrs;
}
function splitMulti(str, ...tokens) {
    let tempChar = tokens[0];
    for (let i = 1; i < tokens.length; i++) {
        str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    if (str.length > 0) {
        if (str[0] == "") {
            str.splice(0, 1);
        }
    }
    return str;
}
function CalculatePolygons(paths) {
    let shapes = ["m", "h", "v", "l", "q", "c", "z"];
    let polygons = [];
    let accuracy = 0.001;
    let movePoint = new DOMPoint();
    let mPoint = new DOMPoint();
    let polygonIndex = 0;
    for (let pathIndex = 0; pathIndex < paths.length;) {
        polygons.push(new Array());
        let currentPolygon = polygons[polygonIndex];
        for (let attributeIndex = 0; attributeIndex < paths[pathIndex].length; attributeIndex++) {
            let attribute = paths[pathIndex][attributeIndex];
            if (attribute.name == "d") {
                let currentShapes = [];
                for (let ind = 0; ind < attribute.value.length; ind++) {
                    if (shapes.indexOf(attribute.value[ind].toString()) != -1) {
                        currentShapes.push(attribute.value[ind]);
                    }
                }
                let points = splitMulti(attribute.value, ...shapes);
                for (let index = 0; index < currentShapes.length; index++) {
                    if (currentShapes[index] == "z") {
                        currentPolygon.push(mPoint);
                        polygons.push(new Array());
                        polygonIndex++;
                        currentPolygon = polygons[polygonIndex];
                        continue;
                    }
                    if (currentShapes[index] == "h") {
                        let value = parseFloat(points[index]);
                        movePoint = new DOMPoint(value, movePoint.y);
                        currentPolygon.push(movePoint);
                        continue;
                    }
                    if (currentShapes[index] == "v") {
                        let value = parseFloat(points[index]);
                        movePoint = new DOMPoint(movePoint.x, value);
                        currentPolygon.push(movePoint);
                        continue;
                    }
                    let shapeControlPoints = [];
                    let split = points[index].split(" ");
                    for (let index = 0; index < split.length; index++) {
                        if (split[index] == "") {
                            split.splice(index, 1);
                        }
                    }
                    for (let i = 0; i < split.length; i += 2) {
                        let x = parseFloat(split[i]);
                        let y = parseFloat(split[i + 1]);
                        shapeControlPoints.push(new DOMPoint(x, y));
                    }
                    if (currentShapes[index] == "m") {
                        mPoint = shapeControlPoints[0];
                        movePoint = shapeControlPoints[0];
                    }
                    else if (currentShapes[index] == "l") {
                        movePoint = shapeControlPoints[0];
                    }
                    else if (currentShapes[index] == "q") {
                        let p1 = movePoint;
                        let p2 = shapeControlPoints[0];
                        let p3 = shapeControlPoints[1];
                        for (let t = 0; t < 1; t += accuracy) {
                            let x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * p2.x + t * t * p3.x;
                            let y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * p2.y + t * t * p3.y;
                            currentPolygon.push(new DOMPoint(x, y));
                        }
                        movePoint = shapeControlPoints[1];
                    }
                    else if (currentShapes[index] == "c") {
                        let p1 = movePoint;
                        let p2 = shapeControlPoints[0];
                        let p3 = shapeControlPoints[1];
                        let p4 = shapeControlPoints[2];
                        for (let t = 0; t < 1; t += accuracy) {
                            let x = Math.pow((1 - t), 3) * p1.x + 3 * (1 - t) * (1 - t) * t * p2.x +
                                3 * (1 - t) * t * t * p3.x + Math.pow(t, 3) * p4.x;
                            let y = Math.pow((1 - t), 3) * p1.y + 3 * (1 - t) * (1 - t) * t * p2.y +
                                3 * (1 - t) * t * t * p3.y + Math.pow(t, 3) * p4.y;
                            currentPolygon.push(new DOMPoint(x, y));
                        }
                        movePoint = shapeControlPoints[1];
                    }
                    currentPolygon.push(movePoint);
                }
            }
        }
        polygonIndex++;
        pathIndex++;
    }
    return polygons;
}
//# sourceMappingURL=rasterizesvg.js.map