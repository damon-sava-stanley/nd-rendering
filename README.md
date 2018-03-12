# Readme

Natural Deduction Rendering is a simple Javascript library
for rendering natural deduction proofs in SVG. It supports
MathJax rendering of formulae. The trees are given in a
simple JSON format described by the following schema
(here `!` indicates that null is not permitted).

	FORMULA := string;
	STYLE := "single"|"blank";
	NODE := {
	  conclusion: FORMULA!,
	  left: FORMULA,
	  right: FORMULA,
	  style: STYLE!,
	  children: [NODE]!
	};

The central function is `renderNode` which takes the Javascript
equivalent of the above JSON and outputs an SVG natural deduction
into the desired location. For example.

![Example natural deduction](./example.svg)

# Requirements

Natural deduction uses d3 and MathJax. The example webpage uses
bootstrap for some styling.

# Directions for growth

MathJax integration is currently highly janky. In particular, we
currently cannot handle mixed math-and-text content (i.e. the text
part is simply discarded) so one must use `\text{...}` in math to  
combine the two. Functionality is basic and there is little by way 
of flexibility.