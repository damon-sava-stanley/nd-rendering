/**
 * Create an instance of the node data type.
 *
 * conclusion: string
 * children: [node]
 * style: "blank"|"line"
 * left: string?
 * right: string?
 */
function node(conclusion, children, style="blank", left=null, right=null) {
	return {
		conclusion: conclusion,
		children: children,
		style: style,
		left: left,
		right: right
	};
}

/**
 * Convenience function for making a node with no children and no line above.
 *
 * assumption: string, the formula
 */
function undischargedAssumption(assumption) {
	return node(assumption, []);
}

/**
 * Convenience function for making a node with a line above and optionally
 * annotated with an index.
 *
 * assumption: string, the formula
 * annotation: string?, the annotation to put to the right.
 */
function dischargedAssumption(assumption, annotation=null) {
	return node(assumption, [], "line", null, annotation);
}

function newLine(parentElement, style) {
	if (style === 'blank') return null;
	if (style === 'line') return parentElement.append('line')
		.attr('stroke', 'black').attr('stroke-width', '1');
}

function lineHeight(line) {
	if (line == null) return 0;
	if (line.node().tagName.toLowerCase() === 'line') return 3;
}

/**
 * Move and resize a line such that it is between two points.
 *
 * line: the line to reshift
 * x1: the leftmost x coordinate
 * y1: the topmost y coordinate (note lines are straight)
 * x2: the rightmost x coordinate
 */
function placeBetween(line, x1, y1, x2) {
	if (line == null) return;
	if (line.node().tagName.toLowerCase() === 'line') {
		return line.attr('x1', x1).attr('y1', y1)
		           .attr('x2', x2).attr('y2', y1);
	}
}

function enqueue(cb) {
	MathJax.Hub.Queue(cb);
}

/**
 * This cleans up the MathJax SVG that gets embedded in an SVG
 * when MathJax typesets in order to get it to display.
 *
 */
function cleanEmbeddedMath(el) {
	var svg = el.select('span>svg');
	// i.e. MathJax has not typeset it (because say it contained no math)
	if (svg.empty()) return;
	var svgNode = svg.node();
	// Have to use style rather than BBox or ClientRectangle because
	// the svg (being embedded in an invalid way) does not render properly
	// and so (at least in Chrome) gets 0 width/height by those measures.
	// (Alternatively we could use SVG w/h attr but those are in 'ex')
	var style = window.getComputedStyle(svgNode);
	var width = parseInt(style.getPropertyValue("width"));
	var height = parseInt(style.getPropertyValue("height"));
	var svgViewbox = svg.attr('viewBox');
	var [minX, minY, viewWidth, viewHeight] = svgViewbox.split(' ')
	  .map(x => parseInt(x));
	var xscale = width / viewWidth;
	var yscale = height / viewHeight;
	
	var innerG = el.append('svg:g')
	    .attr('transform','scale('+xscale+','+yscale+')');
	innerG.node().innerHTML = svgNode.innerHTML;
	el.select('text').remove();
}

/**
 * Render a node to an <svg> or <g>
 *
 * parentElement: d3node, the parent
 * node: node, the node to render
 * returns: void
 */
function renderNode(parentElement, node) {
	// Creation
	var conclusion = parentElement.append('svg:g');
	conclusion.append('svg:text').text(node.conclusion);
	
	var left = !node.left ? null : parentElement.append('svg:g');
	if (left != null) left.append('svg:text').text(node.left);
	  
	var right = !node.left ? null : parentElement.append('svg:g');
	if (right != null) right.append('svg:text').text(node.right);
	 
	var line = newLine(parentElement, node.style);
	
	var children = node.children.map(function (child) {
		var childG = parentElement.append('svg:g');
		renderNode(childG, child);
		return childG;
	});
	
	[conclusion, left, right].forEach(function (el) {
		if (el != null) {
			var text = el.select('text').text();
			if (text.includes("$") || text.includes("\\(")) {
				enqueue(["Typeset", MathJax.Hub, el.node()]);
				enqueue(() => cleanEmbeddedMath(el));
			}
		}
	});
	// Calculating reposition
	enqueue(() => {
	var childCount = children.length;
	var gutter = 2;
	
	var conclusionBox = conclusion.node().getBBox();
	var conclusionWidth = conclusionBox.width;
	var conclusionHeight = conclusionBox.height;
	
	var leftOffset = left == null ? 0 : (left.node().getBBox().width + gutter);
	
	var childrenWidths = children.map(c => c.node().getBBox().width);
	var childrenHeights = children.map(c => c.node().getBBox().height);
	var maxHeight = childCount == 0 ? 0 : Math.max.apply(null, childrenHeights);
	var childrenWidth = childrenWidths.reduce((a, b) => a + b, 0);
	var childrenXOff = [];
	var childXOff = 0;
	var childGutters = childCount <= 1 ? 0 : Math.max(gutter, (conclusionWidth - childrenWidth) / (childCount - 1));
	
	childrenWidths.forEach((w, i) => {
		childrenXOff.push(childXOff);
		childXOff += w;
		if (i < childCount - 1) childXOff += childGutters;
	});
	
	var lineY = maxHeight +  lineHeight(line) + gutter;
	var conclusionBot = lineY + conclusionHeight;
	
	var leftMostChildX = Infinity;
	if (childCount > 0) {
		var firstChildNode = children[0].node();
		var firstChildWidth = firstChildNode.getBBox().width;
		var firstChildConclusionWidth = firstChildNode.firstChild.getBBox().width;
		leftMostChildX = (firstChildWidth - firstChildConclusionWidth) / 2;
	}
	
	var rightMostChildX = -Infinity;
	if (childCount > 0) {
		var lastChildNode = children[childCount - 1].node();
		var lastChildWidth = lastChildNode.getBBox().width;
		var lastChildConclusionWidth = lastChildNode.firstChild.getBBox().width;
		rightMostChildX = childXOff - ((lastChildWidth - lastChildConclusionWidth) / 2);
	}
	var midpoint = childCount == 0 ? conclusionWidth / 2 : (leftMostChildX + rightMostChildX) / 2;
	
	var conclusionLeft = midpoint - (conclusionWidth / 2);
	var conclusionRight = midpoint + (conclusionWidth / 2);
	
	var leftMost = Math.min(conclusionLeft, leftMostChildX);
	var shiftRight = leftMost < leftOffset ? leftOffset - leftMost : 0;
	var rightMost = Math.max(conclusionRight, rightMostChildX);
	
	// Reposition
	children.forEach((c, i) => { 
		var xOff = childrenXOff[i] + shiftRight;
		var yOff = maxHeight - c.node().getBBox().height;
		c.attr('transform', 'translate(' +  xOff + ',' + yOff  +')')
	});
	
	placeBetween(line, leftMost + shiftRight, lineY, rightMost + shiftRight);
	conclusion.attr('transform', 
	  'translate(' + (shiftRight+conclusionLeft) + ',' + conclusionBot + ')');
	if (left != null) {
		var leftBox = left.node().getBBox();
		var leftX = (leftMost + shiftRight) - (leftBox.width + gutter);
		var leftHeight = lineY + (leftBox.height / 2);
		left.attr('transform', 'translate('+leftX+','+leftHeight+')');
	}
	if (right != null) {
		var rightHeight = lineY + (right.node().getBBox().height / 2);
		var x = shiftRight + rightMost + gutter;
		var y = rightHeight;
		right.attr('transform', 'translate('+x+','+y+')');
	}
	});
}

function handleForm() {
	var jsonTA = document.getElementById("nd-json");
	var json = jsonTA.value;
	var nd = JSON.parse(json);
	
	var svg = d3.select("#nd-svg");
	svg.selectAll('*').remove();
	
	renderNode(svg, nd);
	
	enqueue(() => {
		var svgNode = svg.node();
		var rect = svgNode.getBBox();
		svgNode.style.width = rect.x + rect.width;
		svgNode.style.height = rect.y + rect.height;
	});
	
	return false;
}

function ntreeFormula(n, d, formula) {
	if (d <= 1) return undischargedAssumption(formula);
	var child = ntreeFormula(n, d - 1, formula);
	var children = Array(n).fill(child);
	return node(formula, children, "line", (d-1).toString(), (d-1).toString() + "'");
}

function main() {
	MathJax.Hub.Config({
	  jax: ["input/TeX","output/SVG"],
	  extensions: ["tex2jax.js"],
	  TeX: {
		extensions: ["AMSmath.js","AMSsymbols.js","noErrors.js","noUndefined.js"]
	  },
      tex2jax: {
        inlineMath: [ ['$','$'], ["\\(","\\)"] ],
        processEscapes: true
      }
    });
	
	var container = document.getElementById("container");
	
	var n = ntreeFormula(2, 3, "A");
	
	var jsonTA = document.getElementById("nd-json");
	jsonTA.value = JSON.stringify(n, null, 2);
	  
	handleForm();
}

main();