"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = convert;

var _babelGenerator = require("babel-generator");

var _babelGenerator2 = _interopRequireDefault(_babelGenerator);

var _consts = require("./consts");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var babylon = require("babylon");


function isPropsDeclaration(declaration) {
  var init = declaration.init;


  if (init.type === "MemberExpression" && init.object.type === "ThisExpression" && init.property.type === "Identifier" && init.property.name === "props") {
    return true;
  }
}

function isPropsExpression(expression) {
  return expression.type === "MemberExpression" && expression.object && expression.object.property && expression.object.property.name === "props";
}

// collectParams iterates through a params object as returned by babel and
// adds the identifiers to the given context
function collectParams(ctx, params) {
  for (var j = 0; j < params.length; j++) {
    var param = params[j];

    for (var k = 0; k < param.properties.length; k++) {
      var property = param.properties[k];

      ctx.props.push(property.value.name);
    }
  }
}

// walkTree traverses an abstract syntax tree
function walkTree(node, ctx) {
  switch (node.type) {
    case "Program":
      {
        var body = node.body;


        for (var i = 0; i < body.length; i++) {
          var n = body[i];

          walkTree(n, ctx);
        }
        break;
      }
    case "ExportDefaultDeclaration":
      {
        var declaration = node.declaration;


        if (declaration.type === "ClassDeclaration") {
          ctx.defaultExport = true;

          walkTree(declaration, ctx);
        } else if (declaration.type === "ArrowFunctionExpression") {
          ctx.type = _consts.typeFunctional;
          ctx.defaultExport = true;

          collectParams(ctx, declaration.params);
          walkTree(declaration.body, ctx);
        } else if (declaration.type === "Identifier") {
          ctx.namedExport = true;
        }

        break;
      }
    case "ClassDeclaration":
      {
        ctx.type = _consts.typeClass;
        ctx.identifier = node.id.name;

        walkTree(node.body, ctx);
      }
    case "ClassBody":
      {
        var _body = node.body;


        for (var _i = 0; _i < _body.length; _i++) {
          var nd = _body[_i];

          if (nd.type === "ClassMethod") {
            if (nd.key.name === "render") {
              walkTree(nd.body, ctx);
              // break because render method is all we concern
              break;
            }
          }
        }
      }
    case "BlockStatement":
      {
        var _body2 = node.body;


        for (var _i2 = 0; _i2 < _body2.length; _i2++) {
          var _nd = _body2[_i2];

          if (_nd.type === "VariableDeclaration") {
            walkTree(_nd, ctx);
          } else if (_nd.type === "ReturnStatement") {
            ctx.jsxBodyTree = _nd.argument;

            var children = _nd.argument.children;


            for (var j = 0; j < children.length; j++) {
              var child = children[j];

              walkTree(child, ctx);
            }
          }
        }

        break;
      }
    case "VariableDeclaration":
      {
        var declarations = node.declarations;


        for (var _i3 = 0; _i3 < declarations.length; _i3++) {
          var dec = declarations[_i3];

          if (dec.type === "VariableDeclarator") {
            if (isPropsDeclaration(dec)) {
              for (var _j = 0; _j < dec.id.properties.length; _j++) {
                var property = dec.id.properties[_j];

                ctx.props.push(property.value.name);
              }
            } else if (dec.init.type === "ArrowFunctionExpression") {
              ctx.type = _consts.typeFunctional;
              ctx.identifier = dec.id.name;

              var params = dec.init.params;


              collectParams(ctx, params);
              walkTree(dec.init.body, ctx);
            }
          }
        }
      }
    case "JSXExpressionContainer":
      {
        var expression = node.expression;


        if (expression && isPropsExpression(expression)) {
          ctx.props.push(expression.property.name);
        }
      }
  }

  return ctx;
}

function removeInitialIndent(codeStr) {
  var parts = codeStr.split(/\r?\n/);

  if (parts.length === 1) {
    return codeStr;
  }

  var secondLine = parts[1];

  var matched = secondLine.match(/^([\s\t]*)/);
  var leadingSpaces = matched[1];
  var leadingSpaceLen = leadingSpaces.length;

  // TODO: this should be configurable
  var defaultIndent = 2;
  var regex = new RegExp("^[\\s\\t]{" + (leadingSpaceLen - defaultIndent) + "}", "g");

  return parts.map(function (line, idx) {
    return line.replace(regex, "", "g");
  }).join("\n");
}

function repeat(str, n) {
  var ret = "";

  for (var i = 0; i < n; i++) {
    ret = ret + str;
  }

  return ret;
}

function indentCode(codeStr, baseIndent) {
  var str = removeInitialIndent(codeStr);

  return str.split(/\r?\n/).map(function (line) {
    return baseIndent + line;
  }).join("\n");
}

function transformBody(type, code) {
  if (type === _consts.typeClass) {
    return code.replace(/this\.props\.(\w+)/g, "$1");
  }

  return code;
}

function destructureProps(props) {
  return "const {" + props.join(', ') + "} = this.props";
}

function outputClass(ctx, code) {
  var id = void 0;
  if (ctx.identifier) {
    id = ctx.identifier;
  } else {
    id = "MyComponent";
  }

  var ret = "class " + id + " extends React.Component {\n  render() {\n    " + destructureProps(ctx.props) + "\n\n    return (\n" + indentCode(code, "      ") + "\n    )\n  }\n}";

  if (ctx.defaultExport) {
    ret = "export default " + ret;
  } else if (ctx.namedExport) {
    ret = ret + "\n\nexport default " + id + "\n";
  }

  return ret;
}

function outputFunctional(ctx, code) {
  var id = ctx.identifier;

  var ret = "({" + ctx.props.join(", ") + "}) => {\n  return (\n" + indentCode(code, "    ") + "\n  )\n}";

  if (ctx.defaultExport) {
    ret = "export default " + ret;
  } else if (ctx.namedExport) {
    ret = "const " + id + " = " + ret + "\n\nexport default " + id;
  } else {
    ret = "const " + id + " = " + ret;
  }

  return ret;
}

function output(ctx) {
  var result = (0, _babelGenerator2.default)(ctx.jsxBodyTree);
  console.log('result', result.code);
  var code = transformBody(ctx.type, result.code);

  if (ctx.type === _consts.typeClass) {
    return outputFunctional(ctx, code);
  }

  return outputClass(ctx, code);
}

function convert(code) {
  var ast = babylon.parse(code, {
    sourceType: "module",
    plugins: ["jsx"]
  });

  var context = {
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