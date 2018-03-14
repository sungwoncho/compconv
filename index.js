const babylon = require('babylon');

const sample1 = `
export default class Foo extends React.Component {
  render() {
    const { foo, bar } = this.props;
    return (
      <div>
        Foo
      </div>
    )
  }
}
`;


const sample2 = `
const Foo = ({ foo }) => {
  return (
    <div>
      Foo {foo}
    </div>
  )
}

export default Foo
`

const sample3 = `
export default ({ foo }) => {
  return (
    <div>
      Foo
    </div>
  )
}
`

const  ExportDefaultDeclaration= 'ExportDefaultDeclaration';

const typeFunctional = 0;
const typeClass = 1;

const context = {
  namedExport: null,
  defaultExport: null,
  identifier: null,
  type: null,
  props: []
}

function isPropsDeclaration(declaration) {
  const { init } = declaration

  console.log('init',init.type, init.object.type, init.property.type, init.property.name)
  if (init.type === 'MemberExpression' && init.object.type === 'ThisExpression' && init.property.type === 'Identifier' && init.property.name === 'props') {
    return true
  }
}

// walkTree traverses an abstract syntax tree
function walkTree(node, ctx) {
  const { body } = ast.program;

  switch (node.type) {
    case 'Program': {
      for (let i = 0; i < body.length; i++) {
        const n = body[i];

        walkTree(n, ctx);
      }
      break
    }
    case 'ExportDefaultDeclaration': {
      const { declaration } = node;

      ctx.defaultExport = true;

      if (declaration.type === 'ClassDeclaration') {
        ctx.type = typeClass;
        ctx.identifier = declaration.id.name;
      } else if (declaration.type === 'ArrowFunctionExpression') {
        // IDEA: collect arguments as props
        ctx.type = typeFunctional;
      }

      walkTree(declaration.body, ctx)
      break;
    }
    case 'ClassBody': {
      const { body } = node

      for (let i = 0; i < body.length; i++) {
        const nd = body[i];

        if (nd.type === 'ClassMethod') {
          if(nd.key.name === 'render') {
            walkTree(nd.body, ctx)
            // break because render method is all we concern
            break;
          }
        }
      }
    }
    case 'BlockStatement': {
      const { body } = node;

      for (let i = 0; i < body.length; i++) {
        const nd = body[i];

        if (nd.type === 'VariableDeclaration') {
          walkTree(nd, ctx)
        }
      }

      break;
    }
    case 'VariableDeclaration': {
      console.log('@@',node)
      const { declarations } = node;

      for (let i = 0; i < declarations.length; i++) {
        const dec= declarations[i];

        console.log('$$',dec)
        if (dec.type === 'VariableDeclarator' && isPropsDeclaration(dec)) {
          for (let j = 0; j < dec.id.properties.length; j++) {
            const property = dec.id.properties[j];

            ctx.props.push(property.value.name)
          }
        }
      }
    }
  }

  return ctx
}


const ast = babylon.parse(sample1, {
  sourceType: 'module',
  plugins: ['jsx']
});


walkTree(ast.program, context)
console.log(context)

//console.log(JSON.stringify(ast, null, 2));

