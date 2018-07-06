import chai from "chai";
import convert from "./convert";

const { expect } = chai;

describe("convert", function() {
  it("converts class, default export, spread props, with React.Component", function() {
    const input = `export default class Foo extends React.Component {
render() {
  const { foo, bar } = this.props;
    return (
      <div>
        <span>
          Hello world
          <div>
            {foo}
          </div>
        </span>
        This is {foo} {bar}
      </div>
    )
  }
}`;

    const output = convert(input);

    expect(output).to.equal(`export default ({foo, bar}) => {
  return (
    <div>
      <span>
        Hello world
        <div>
          {foo}
        </div>
      </span>
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

    expect(output).to.equal(`export default ({foo, bar}) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  )
}`);
  });

  it("converts class, default export, unspread props", function() {
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

    expect(output).to.equal(`export default ({foo, bar}) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  )
}`);
  });

  it("converts class, no export", function() {
    const input = `class Foo extends React.Component {
  render() {
    return (
      <div>
        This is {this.props.foo} {this.props.bar}
      </div>
    )
  }
}`;

    const output = convert(input);

    expect(output).to.equal(`const Foo = ({foo, bar}) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  )
}`);
  });

  it("converts class, named export", function() {
    const input = `class Foo extends React.Component {
  render() {
    return (
      <div>
        This is {this.props.foo} {this.props.bar}
      </div>
    )
  }
}

export default Foo`;

    const output = convert(input);

    expect(output).to.equal(`const Foo = ({foo, bar}) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  )
}

export default Foo`);
  });

  it("converts a function, default export", function() {
    const input = `export default ({ foo, bar  }) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  );
};`;

    const output = convert(input);

    expect(output).to
      .equal(`export default class MyComponent extends React.Component {
  render() {
    const {foo, bar} = this.props

    return (
      <div>
        This is {foo} {bar}
      </div>
    )
  }
}`);
  });

  it("converts functional, no export", function() {
    const input = `const Foo = ({ foo, bar  }) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  );
};`;

    const output = convert(input);

    expect(output).to.equal(`class Foo extends React.Component {
  render() {
    const {foo, bar} = this.props

    return (
      <div>
        This is {foo} {bar}
      </div>
    )
  }
}`);
  });

  it("converts functional, named export", function() {
    const input = `const Foo = ({ foo, bar  }) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  );
};

export default Foo;
`;

    const output = convert(input);

    expect(output).to.equal(`class Foo extends React.Component {
  render() {
    const {foo, bar} = this.props

    return (
      <div>
        This is {foo} {bar}
      </div>
    )
  }
}

export default Foo
`);
  });

  it.only("converts function with a destructured prop", function() {
    const input = `const Foo = ({foo, bar}) => {
  const { baz } = foo
  const { quuz } = bar
  const { quz } = baz

  return (
    <div>
      Hello world {quuz} {quz}
    </div>
  )
}`;

    const output = convert(input);

    expect(output).to.equal(`class Foo extends React.Component {
  render() {
    const {foo, bar} = this.props
    const { baz } = foo
    const { quuz } = bar
    const { quz } = baz

    return (
      <div>
        Hello world {quuz} {quz}
      </div>
    )
  }
}`);
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
