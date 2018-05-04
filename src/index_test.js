import chai from "chai";
import convert from "./index";

const { expect } = chai;

describe("convert", function() {
  it("converts class, default export, spread props, with React.Component", function() {
    const input = `export default class Foo extends React.Component {
render() {
  const { foo, bar } = this.props;
    return (
      <div>
        This is {foo} {bar}
      </div>
    )
  }
}`;

    const output = convert(input);

    expect(output).to.equal(`export defult ({foo, bar}) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  )
}`);
  });

  it("converts class, default export, spread props", function() {
    const input = `export default class Foo extends Component {
render() {
  const { foo, bar } = this.props;
    return (
      <div>
        This is {foo} {bar}
      </div>
    )
  }
}`;

    const output = convert(input);

    expect(output).to.equal(`export defult ({foo, bar}) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  )
}`);
  });

  it.only("converts class, default export, unspread props", function() {
    const input = `export default class Foo extends React.Component {
render() {
    return (
      <div>
        This is {this.props.foo} {this.props.bar}
      </div>
    )
  }
}`;

    const output = convert(input);

    expect(output).to.equal(`export defult ({foo, bar}) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  )
}`);
  });
});
