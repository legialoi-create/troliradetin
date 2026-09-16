import { renderToString } from "react-dom/server";
import { InlineMath } from "react-katex";
import React from "react";

console.log(renderToString(React.createElement(InlineMath, { math: "1 \\le n \\le 100" })));
