const babylon = require("babylon");
import generate from "babel-generator";

import { typeFunctional, typeClass } from "./consts";

function isPropsDeclaration(ctx, declaration) {
  const { init } = declaration;
  const { propTree } = ctx;

  const props = Object.keys(propTree);

  if (init.type === "Identifier" && props.indexOf(init.name) > -1) {
    return true;
  }
}

function isPropsDestructuring(declaration) {
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

function isPropsExpression(expression) {
  return (
    expression.type === "MemberExpression" &&
    expression.object &&
    expression.object.property &&
    expression.object.property.name === "props"
  );
}

// collectProps iterates through a ObjectPattern object as returned by babel and
// adds the identifiers to the given context
function collectProps(ctx, objPattern) {
  for (let k = 0; k < objPattern.properties.length; k++) {
    const property = objPattern.properties[k];

    const propName = property.value.name;
    ctx.propTree[propName] = null;
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

      if (declaration.type === "ClassDeclaration") {
        ctx.defaultExport = true;

        walkTree(declaration, ctx);
      } else if (declaration.type === "ArrowFunctionExpression") {
        ctx.type = typeFunctional;
        ctx.defaultExport = true;

        const objPattern = declaration.params[0];
        collectProps(ctx, objPattern);
        walkTree(declaration.body, ctx);
      } else if (declaration.type === "Identifier") {
        ctx.namedExport = true;
      }

      break;
    }
    case "ClassDeclaration": {
      ctx.type = typeClass;
      ctx.identifier = node.id.name;

      walkTree(node.body, ctx);
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

          const { children } = nd.argument;

          for (let j = 0; j < children.length; j++) {
            const child = children[j];

            walkTree(child, ctx);
          }
        }
      }

      break;
    }
    case "VariableDeclaration": {
      const { declarations } = node;

      for (let i = 0; i < declarations.length; i++) {
        const dec = declarations[i];

        if (dec.type === "VariableDeclarator") {
          if (isPropsDeclaration(dec)) {
            collectProps(ctx, dec.id);
          } else if (dec.init.type === "ArrowFunctionExpression") {
            ctx.type = typeFunctional;
            ctx.identifier = dec.id.name;

            const { params } = dec.init;

            for (let j = 0; j < params.length; j++) {
              const param = params[j];

              collectProps(ctx, param);
            }
            walkTree(dec.init.body, ctx);
          } else {
            // is it a destructuring of a prop or one of its children?
            const parentId = dec.init.name;

            // TODO: do breadth first search or depth first search recursively
            for (let j = 0; j < Object.keys(ctx.propTree).length; j++) {
              const key = Object.keys(ctx.propTree)[j];

              if (key === parentId) {
              }
            }
          }
        }
      }
    }
    case "JSXExpressionContainer": {
      const { expression } = node;

      if (expression && isPropsExpression(expression)) {
        const propName = expression.property.name;

        ctx.propTree[propName] = null;
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

function indentCode(codeStr, baseIndent) {
  const str = removeInitialIndent(codeStr);

  return str
    .split(/\r?\n/)
    .map(line => {
      return baseIndent + line;
    })
    .join("\n");
}

function transformBody(type, code) {
  if (type === typeClass) {
    return code.replace(/this\.props\.(\w+)/g, "$1");
  }

  return code;
}

function destructureProps(propTree) {
  let ret = "";

  const props = Object.keys(propTree);
  ret = `const {${props.join(", ")}} = this.props`;

  return ret;
}

function outputClass(ctx, code) {
  let id;
  if (ctx.identifier) {
    id = ctx.identifier;
  } else {
    id = "MyComponent";
  }

  let ret = `class ${id} extends React.Component {
  render() {
    ${destructureProps(ctx.propTree)}

    return (
${indentCode(code, "      ")}
    )
  }
}`;

  if (ctx.defaultExport) {
    ret = `export default ${ret}`;
  } else if (ctx.namedExport) {
    ret = `${ret}

export default ${id}
`;
  }

  return ret;
}

function outputFunctional(ctx, code) {
  const id = ctx.identifier;

  const props = Object.keys(ctx.propTree);

  let ret = `({${props.join(", ")}}) => {
  return (
${indentCode(code, "    ")}
  )
}`;

  if (ctx.defaultExport) {
    ret = `export default ${ret}`;
  } else if (ctx.namedExport) {
    ret = `const ${id} = ${ret}

export default ${id}`;
  } else {
    ret = `const ${id} = ${ret}`;
  }

  return ret;
}

function output(ctx) {
  const result = generate(ctx.jsxBodyTree);
  const code = transformBody(ctx.type, result.code);
  console.log("props", ctx.propTree);

  if (ctx.type === typeClass) {
    return outputFunctional(ctx, code);
  }

  return outputClass(ctx, code);
}

export default function(code) {
  const ast = babylon.parse(code, {
    sourceType: "module",
    plugins: ["jsx"]
  });

  const context = {
    namedExport: null,
    defaultExport: null,
    identifier: null,
    type: null,
    propTree: {},
    jsxBodyTree: null
  };

  walkTree(ast.program, context);
  return output(context);
}
