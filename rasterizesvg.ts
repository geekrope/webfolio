class Attribute {
	public constructor(name: string, value: string) {
		this.name = name;
		this.value = value;
	}
	name: string;
	value: string;
}
function ParseSvg(src: string) {
	var paths: string[] = [];
	var attrs: Attribute[][] = [];
	var openTag = "<path";
	var closeTag = "/>";
	var pathIndex = 0;
	for (; ;) {
		paths.push(content);
		if (ind1 == -1 || ind2 == -1) {
			break;
		}
		var ind1 = src.indexOf(openTag);
		var ind2 = src.indexOf(closeTag);
		var content = src.substring(ind1 + openTag.length, ind2);
		var split = content.split(" ");
		attrs.push(new Array<Attribute>());
		for (let index = 0; index < split.length; index++) {
			if (split[index] == "") {
				split.splice(index);
				index--;
			}
			else {
				var fInd = split[index].indexOf(`"`);
				var sInd = split[index].replace(`"`, "").indexOf(`"`);
				attrs[pathIndex].push(new Attribute(split[index].split("=")[0], content.substring(fInd + 1, sInd)));
			}
		}
		pathIndex++;
	}
}
