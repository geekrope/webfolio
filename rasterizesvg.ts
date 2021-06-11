class Attribute {
	public constructor(name: string, value: string) {
		this.name = name;
		this.value = value;
	}
	name: string;
	value: string;
}
function ParseSvg(src: string): Attribute[][] {
	var attrs: Attribute[][] = [];
	var openTag = "<path";
	var closeTag = "/>";
	var pathIndex = 0;
	for (; ;) {
		var ind1 = src.indexOf(openTag);
		var ind2 = src.indexOf(closeTag);
		if (ind1 == -1 || ind2 == -1) {
			break;
		}
		var content = src.substring(ind1 + openTag.length, ind2);
		src = src.replace(openTag + content + closeTag, "");
		content = content.toLowerCase();
		var split = content.split(`"`,);
		attrs.push(new Array<Attribute>());
		for (let index = 0; index < split.length; index += 2) {
			if (split[index] == "") {
				split.splice(index);
				index--;
			}
			else {
				var name = split[index].replace("=", "");
				for (; name.indexOf(" ") != -1;) {
					name = name.replace(" ", "");
				}
				var value = split[index + 1];
				attrs[pathIndex].push(new Attribute(name, value));
			}
		}
		pathIndex++;
	}
	return attrs;
}

interface Line {
	point1: DOMPoint;
	point2: DOMPoint;
}

interface Bezier3 {
	point1: DOMPoint;
	point2: DOMPoint;
	point3: DOMPoint;
}

interface Bezier4 {
	point1: DOMPoint;
	point2: DOMPoint;
	point3: DOMPoint;
}

function splitMulti(str: any, ...tokens: string[]) {
	var tempChar = tokens[0];
	for (var i = 1; i < tokens.length; i++) {
		str = str.split(tokens[i]).join(tempChar);
	}
	str = str.split(tempChar);
	for (let index = 0; index < str.length; index++) {
		if (str[index] == "") {
			str.splice(index, 1);
		}
	}
	return str;
}

function CalculatePolygons(paths: Attribute[][]): DOMPoint[][] {
	var shapes = ["m", "h", "v", "l", "q", "c", "z"];
	var polygons: DOMPoint[][] = [];
	var accuracy = 0.001;
	var movePoint = new DOMPoint();
	for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
		polygons.push(new Array<DOMPoint>());
		for (let attributeIndex = 0; attributeIndex < paths[pathIndex].length; attributeIndex++) {
			var attribute = paths[pathIndex][attributeIndex];
			if (attribute.name == "d") {
				var points = splitMulti(attribute.value, ...shapes);
				var currentShapes = splitMulti(attribute.value, ...points);
				for (let index = 0; index < currentShapes.length; index++) {
					if (currentShapes[index] == "z") {
						polygons.push(new Array<DOMPoint>());
						continue;
					}
					var shapeControlPoints: DOMPoint[] = [];
					var split = points[index].split(" ");
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
						movePoint = shapeControlPoints[0];
					}
					else if (currentShapes[index] == "l") {
						movePoint = shapeControlPoints[0];
					}
					else if (currentShapes[index] == "q") {
						var p1 = movePoint;
						var p2 = shapeControlPoints[0];
						var p3 = shapeControlPoints[1];
						for (var t = 0; t < 1; t += accuracy) {
							let x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * p2.x + t * t * p3.x;
							let y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * p2.y + t * t * p3.y;
							polygons[pathIndex].push(new DOMPoint(x, y));
						}
						movePoint = shapeControlPoints[1];
					}
					else if (currentShapes[index] == "c") {
						var p1 = movePoint;
						var p2 = shapeControlPoints[0];
						var p3 = shapeControlPoints[1];
						var p4 = shapeControlPoints[2];
						for (var t = 0; t < 1; t += accuracy) {
							let x = Math.pow((1 - t), 3) * p1.x + 3 * (1 - t) * (1 - t) * t * p2.x +
								3 * (1 - t) * t * t * p3.x + Math.pow(t, 3) * p4.x;
							let y = Math.pow((1 - t), 3) * p1.y + 3 * (1 - t) * (1 - t) * t * p2.y +
								3 * (1 - t) * t * t * p3.y + Math.pow(t, 3) * p4.y;
							polygons[pathIndex].push(new DOMPoint(x, y));
						}
						movePoint = shapeControlPoints[1];
					}
					polygons[pathIndex].push(movePoint);
				}
			}
		}
	}
	return polygons;
}
