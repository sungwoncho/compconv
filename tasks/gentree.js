const babylon = require("babylon");

const sample = `
export default class Foo extends React.Component {
  render() {
    return (
      <div>
        This is {this.props.foo} {this.props.bar}
      </div>
    )
  }
}
`;

const ast = babylon.parse(sample, {
  sourceType: "module",
  plugins: ["jsx"]
});

console.log(JSON.stringify(ast, null, 2));
