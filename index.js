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