const babylon = require("babylon");
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

function isPropsExpression(expression) {
  return (
    expression.type === "MemberExpression" &&
    expression.object &&
    expression.object.property &&
    expression.object.property.name === "props"
  );
}

// collectParams iterates through a params object as returned by babel and
// adds the identifiers to the given context
function collectParams(ctx, params) {
  for (let j = 0; j < params.length; j++) {
    const param = params[j];

    for (let k = 0; k < param.properties.length; k++) {
      const property = param.properties[k];

      ctx.props.push(property.value.name);
    }
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

        collectParams(ctx, declaration.params)
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
            for (let j = 0; j < dec.id.properties.length; j++) {
              const property = dec.id.properties[j];

              ctx.props.push(property.value.name);
            }
          } else if (dec.init.type === "ArrowFunctionExpression") {
            ctx.type = typeFunctional;
            ctx.identifier = dec.id.name;

            const { params } = dec.init;

            collectParams(ctx, params)
            walkTree(dec.init.body, ctx);
          }
        }
      }
    }
    case "JSXExpressionContainer": {
      const { expression } = node;

      if (expression && isPropsExpression(expression)) {
        ctx.props.push(expression.property.name);
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

function destructureProps(props) {
  return `const {${props.join(', ') }} = this.props`
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
    ${destructureProps(ctx.props)}

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

  let ret = `({${ctx.props.join(", ")}}) => {
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
  console.log('result',result.code);
  const code = transformBody(ctx.type, result.code);

  if (ctx.type === typeClass) {
    return outputFunctional(ctx, code);
  }

  return outputClass(ctx, code);
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
