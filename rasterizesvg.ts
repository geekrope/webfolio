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
		var ind1 = src.indexOf(openTag);
		var ind2 = src.indexOf(closeTag);
		if (ind1 == -1 || ind2 == -1) {
			break;
		}
		var content = src.substring(ind1 + openTag.length, ind2);
		src = src.replace(openTag + content + closeTag, "");
		paths.push(content);
		for (; content.indexOf(" ") == -1;) {
			content = content.replace(" ", "");
		}
		var split = content.split(`"`);
		attrs.push(new Array<Attribute>());
		for (let index = 0; index < split.length; index += 2) {
			if (split[index] == "") {
				split.splice(index);
				index--;
			}
			else {
				var name = split[index].replace("=", "");
				var value = split[index + 1];
				attrs[pathIndex].push(new Attribute(name, value));
			}
		}
		pathIndex++;
	}
}
