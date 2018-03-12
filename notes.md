ND rendering:

Basic idea:

A natural deduction is a finitary tree whose nodes are labeled with
formuale, branches have a style specified (single line, dots) and
optionally left and right formula. To be more specific in a json format
we have

FORMULA := string;
STYLE := "single"|"blank"; (in future perhaps have summary and double lines)
NODE := {
  conclusion: FORMULA,
  left: FORMULA, (default: null)
  right: FORMULA, (default: null)
  style: STYLE, (default: "single"),
  children: [NODE]
};

The only technical problem in rendering (rendering formula can be handed
off to MathJax) is to place boxes so that they do not overlap. Here's an
intuitive and kind of dumb way to do this (dumb because it leads to larger
than necessary gutters): when rendering a node in a box, first render all
of the children to boxes (recursively). Let m = max width of those rendered
boxes. Place them evenly so that there is m distance between the centers of
each and the bottom of each is flush against some horizontal line. Let d 
be the center point of the bottoms of the first and last box (f and l), then
render (but do not place) the conclusion formula, then we draw the line (if 
the style is not blank), whose  width is max(l - f + width(f)/2 + l/2)
then place the conclusion so its top-central point is directly below
the