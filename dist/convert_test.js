"use strict";

var _chai = require("chai");

var _chai2 = _interopRequireDefault(_chai);

var _convert = require("./convert");

var _convert2 = _interopRequireDefault(_convert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var expect = _chai2.default.expect;


describe("convert", function () {
  it("converts class, default export, spread props, with React.Component", function () {
    var input = "export default class Foo extends React.Component {\nrender() {\n  const { foo, bar } = this.props;\n    return (\n      <div>\n        <span>\n          Hello world\n          <div>\n            {foo}\n          </div>\n        </span>\n        This is {foo} {bar}\n      </div>\n    )\n  }\n}";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("export default ({foo, bar}) => {\n  return (\n    <div>\n      <span>\n        Hello world\n        <div>\n          {foo}\n        </div>\n      </span>\n      This is {foo} {bar}\n    </div>\n  )\n}");
  });

  it("converts class, default export, spread props", function () {
    var input = "export default class Foo extends Component {\nrender() {\n  const { foo, bar } = this.props;\n    return (\n      <div>\n        This is {foo} {bar}\n      </div>\n    )\n  }\n}";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("export default ({foo, bar}) => {\n  return (\n    <div>\n      This is {foo} {bar}\n    </div>\n  )\n}");
  });

  it("converts class, default export, unspread props", function () {
    var input = "export default class Foo extends React.Component {\nrender() {\n    return (\n      <div>\n        This is {this.props.foo} {this.props.bar}\n      </div>\n    )\n  }\n}";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("export default ({foo, bar}) => {\n  return (\n    <div>\n      This is {foo} {bar}\n    </div>\n  )\n}");
  });

  it("converts class, no export", function () {
    var input = "class Foo extends React.Component {\n  render() {\n    return (\n      <div>\n        This is {this.props.foo} {this.props.bar}\n      </div>\n    )\n  }\n}";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("const Foo = ({foo, bar}) => {\n  return (\n    <div>\n      This is {foo} {bar}\n    </div>\n  )\n}");
  });

  it("converts class, named export", function () {
    var input = "class Foo extends React.Component {\n  render() {\n    return (\n      <div>\n        This is {this.props.foo} {this.props.bar}\n      </div>\n    )\n  }\n}\n\nexport default Foo";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("const Foo = ({foo, bar}) => {\n  return (\n    <div>\n      This is {foo} {bar}\n    </div>\n  )\n}\n\nexport default Foo");
  });

  it("converts a function, default export", function () {
    var input = "export default ({ foo, bar  }) => {\n  return (\n    <div>\n      This is {foo} {bar}\n    </div>\n  );\n};";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("export default class MyComponent extends React.Component {\n  render() {\n    const {foo, bar} = this.props\n\n    return (\n      <div>\n        This is {foo} {bar}\n      </div>\n    )\n  }\n}");
  });

  it("converts functional, no export", function () {
    var input = "const Foo = ({ foo, bar  }) => {\n  return (\n    <div>\n      This is {foo} {bar}\n    </div>\n  );\n};";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("class Foo extends React.Component {\n  render() {\n    const {foo, bar} = this.props\n\n    return (\n      <div>\n        This is {foo} {bar}\n      </div>\n    )\n  }\n}");
  });

  it("converts functional, named export", function () {
    var input = "const Foo = ({ foo, bar  }) => {\n  return (\n    <div>\n      This is {foo} {bar}\n    </div>\n  );\n};\n\nexport default Foo;\n";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("class Foo extends React.Component {\n  render() {\n    const {foo, bar} = this.props\n\n    return (\n      <div>\n        This is {foo} {bar}\n      </div>\n    )\n  }\n}\n\nexport default Foo\n");
  });

  it.only("converts function with a destructured prop", function () {
    var input = "const Foo = ({foo, bar}) => {\n  const { baz } = foo\n  const { quuz } = bar\n  const { quz } = baz\n\n  return (\n    <div>\n      Hello world {quuz} {quz}\n    </div>\n  )\n}";

    var output = (0, _convert2.default)(input);

    expect(output).to.equal("class Foo extends React.Component {\n  render() {\n    const {foo, bar} = this.props\n    const { baz } = foo\n    const { quuz } = bar\n    const { quz } = baz\n\n    return (\n      <div>\n        Hello world {quuz} {quz}\n      </div>\n    )\n  }\n}");
  });

  //   it("converts function with a inline destructuring of prop", function() {
  //     const input = `const Foo = ({foo, bar}) => {
  //   const { baz } = foo
  //   const { quuz } = bar
  //   const { quz } = baz
  //
  //   return (
  //     <div>
  //       Hi there, { bar } { quuz } { quz }
  //     </div>
  //   )
  // }`;
  //
  //     const output = convert(input);
  //
  //     expect(output).to.equal(`class Foo extends React.Component {
  //   render() {
  //     const { foo } = this.props
  //     const { bar } = foo
  //     const { baz } = bar
  //
  //     return (
  //       <div>
  //         Baz { bar }
  //       </div>
  //     )
  //   }
  // }`);
  //   });

});