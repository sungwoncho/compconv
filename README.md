# compconv

Convert React component between function and class.

## Install

    yarn install compconv

## Usage

Let's convert a functional component to a class component.

```js
import compconv from "compconv";

const input = `export default ({ foo, bar  }) => {
  return (
    <div>
      This is {foo} {bar}
    </div>
  );
};`;

const output = compconv(input);

// output is:
//
// export default class MyComponent extends React.Component {
//   render() {
//     return (
//       <div>
//         This is {this.props.foo} {this.props.bar}
//       </div>
//     )
//   }
// }
```

It also works the other way around.

## License

MIT
