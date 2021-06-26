class Attribute {
	public constructor(name: string, value: string) {
		this.name = name;
		this.value = value;
	}
	name: string;
	value: string;
}
function ParseSvg(src: string): Attribute[][] {
	let attrs: Attribute[][] = [];
	let openTag = "<path";
	let closeTag = "/>";
	let pathIndex = 0;
	for (; ;) {
		let ind1 = src.indexOf(openTag);
		let ind2 = src.indexOf(closeTag);
		if (ind1 == -1 || ind2 == -1) {
			break;
		}
		let content = src.substring(ind1 + openTag.length, ind2);
		src = src.replace(openTag + content + closeTag, "");
		content = content.toLowerCase();
		let split = content.split(`"`,);
		attrs.push(new Array<Attribute>());
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

function splitMulti(str: string, ...tokens: string[]) {
	let tempChar = tokens[0];
	let ret: string[];
	for (let i = 1; i < tokens.length; i++) {
		str = str.split(tokens[i]).join(tempChar);
	}
	ret = str.split(tempChar);
	if (ret.length > 0 && ret[0] == "") {
		ret.splice(0, 1);
	}
	return ret;
}

function CalculatePolygons(paths: Attribute[][]): DOMPoint[][] {
	let shapes = ["m", "h", "v", "l", "q", "c", "z"];
	let polygons: DOMPoint[][] = [];
	let steps = 2;
	let movePoint = new DOMPoint();
	let mPoint = new DOMPoint();
	let polygonIndex = 0;

	for (let pathIndex = 0; pathIndex < paths.length;) {
		polygons.push(new Array<DOMPoint>());
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
						polygons.push(new Array<DOMPoint>());
						polygonIndex++;
						currentPolygon = polygons[polygonIndex];
					}
					else if (currentShapes[index] == "h") {
						let value = parseFloat(points[index]);
						movePoint = new DOMPoint(value, movePoint.y);
						currentPolygon.push(movePoint);
					}
					else if (currentShapes[index] == "v") {
						let value = parseFloat(points[index]);
						movePoint = new DOMPoint(movePoint.x, value);
						currentPolygon.push(movePoint);
					}
					else {
						let shapeControlPoints: DOMPoint[] = [];
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
							for (let step = 0; step <= steps; step += 1) {
								let t = step / (steps);
								let x = (1.0 - t * t) * p1.x + 2.0 * (1 - t) * t * p2.x + t * t * p3.x;
								let y = (1.0 - t * t) * p1.y + 2.0 * (1 - t) * t * p2.y + t * t * p3.y;
								currentPolygon.push(new DOMPoint(x, y));								
							}
							movePoint = shapeControlPoints[1];
						}
						else if (currentShapes[index] == "c") {
							let p1 = movePoint;
							let p2 = shapeControlPoints[0];
							let p3 = shapeControlPoints[1];
							let p4 = shapeControlPoints[2];
							for (let step = 0; step <= steps; step += 1) {
								let t = step / steps;
								let x = (1 - t) * (1 - t) * (1 - t) * p1.x + 3 * (1 - t) * (1 - t) * t * p2.x +
									3 * (1 - t) * t * t * p3.x + t * t * t * p4.x;
								let y = (1 - t) * (1 - t) * (1 - t) * p1.y + 3 * (1 - t) * (1 - t) * t * p2.y +
									3 * (1 - t) * t * t * p3.y + t * t * t * p4.y;
								currentPolygon.push(new DOMPoint(x, y));								
							}
							movePoint = shapeControlPoints[2];
						}
						currentPolygon.push(movePoint);
					}
				}
			}
		}
		polygonIndex++;
		pathIndex++;
	}
	return polygons;
}
