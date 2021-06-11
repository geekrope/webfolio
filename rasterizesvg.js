class Attribute {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
}
function ParseSvg(src) {
    var paths = [];
    var attrs = [];
    var openTag = "<path";
    var closeTag = "/>";
    var pathIndex = 0;
    for (;;) {
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
        attrs.push(new Array());
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
//# sourceMappingURL=rasterizesvg.js.map