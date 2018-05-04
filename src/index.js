//import babylon from 'babylon';
const babylon = require("babylon");
import traverse from "babel-traverse";
import generate from "babel-generator";

import { typeFunctional, typeClass } from "./consts";

function isPropsDeclaration(declaration) {
  const { init } = declaration;

  if (
    init.type === "MemberExpression" &&
    init.object.type === "ThisExpression" &&
    init.property.type === "Identifier" &&
    init.property.name === "props"
  ) {
    return true;
  }
}

// walkTree traverses an abstract syntax tree
function walkTree(node, ctx) {
  switch (node.type) {
    case "Program": {
      const { body } = node;

      for (let i = 0; i < body.length; i++) {
        const n = body[i];

        walkTree(n, ctx);
      }
      break;
    }
    case "ExportDefaultDeclaration": {
      const { declaration } = node;

      ctx.defaultExport = true;

      if (declaration.type === "ClassDeclaration") {
        ctx.type = typeClass;
        ctx.identifier = declaration.id.name;
      } else if (declaration.type === "ArrowFunctionExpression") {
        ctx.type = typeFunctional;
      }

      walkTree(declaration.body, ctx);
      break;
    }
    case "ClassBody": {
      const { body } = node;

      for (let i = 0; i < body.length; i++) {
        const nd = body[i];

        if (nd.type === "ClassMethod") {
          if (nd.key.name === "render") {
            walkTree(nd.body, ctx);
            // break because render method is all we concern
            break;
          }
        }
      }
    }
    case "BlockStatement": {
      const { body } = node;

      for (let i = 0; i < body.length; i++) {
        const nd = body[i];

        if (nd.type === "VariableDeclaration") {
          walkTree(nd, ctx);
        } else if (nd.type === "ReturnStatement") {
          ctx.jsxBodyTree = nd.argument;
        }
      }

      break;
    }
    case "VariableDeclaration": {
      const { declarations } = node;

      for (let i = 0; i < declarations.length; i++) {
        const dec = declarations[i];

        if (dec.type === "VariableDeclarator" && isPropsDeclaration(dec)) {
          for (let j = 0; j < dec.id.properties.length; j++) {
            const property = dec.id.properties[j];

            ctx.props.push(property.value.name);
          }
        }
      }
    }
  }

  return ctx;
}

function removeInitialIndent(codeStr) {
  const parts = codeStr.split(/\r?\n/);

  if (parts.length === 1) {
    return codeStr;
  }

  const secondLine = parts[1];

  const matched = secondLine.match(/^([\s\t]*)/);
  const leadingSpaces = matched[1];
  const leadingSpaceLen = leadingSpaces.length;

  // TODO: this should be configurable
  const defaultIndent = 2;
  const regex = new RegExp(
    `^[\\s\\t]{${leadingSpaceLen - defaultIndent}}`,
    "g"
  );

  return parts
    .map((line, idx) => {
      return line.replace(regex, "", "g");
    })
    .join("\n");
}

function repeat(str, n) {
  let ret = "";

  for (let i = 0; i < n; i++) {
    ret = ret + str;
  }

  return ret;
}

function indentCode(codeStr) {
  const str = removeInitialIndent(codeStr);

  // TODO: configurable
  const unitIndent = "  ";
  const indent = repeat(unitIndent);

  return str
    .split(/\r?\n/)
    .map(line => {
      return "    " + line;
    })
    .join("\n");
}

function output(ctx) {
  const result = generate(ctx.jsxBodyTree);

  if (ctx.type === typeClass) {
    return `export defult ({${ctx.props.join(", ")}}) => {
  return (
${indentCode(result.code)}
  )
}`;
  }

  return "";
}

export default function convert(code) {
  const ast = babylon.parse(code, {
    sourceType: "module",
    plugins: ["jsx"]
  });

  const context = {
    namedExport: null,
    defaultExport: null,
    identifier: null,
    type: null,
    props: [],
    jsxBodyTree: null
  };

  walkTree(ast.program, context);

  return output(context);
}
