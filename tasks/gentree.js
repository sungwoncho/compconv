const babylon = require("babylon");

const sample = `const Foo = ({foo, bar}) => {
  const { baz } = foo
  const { quz } = baz
  const { quuz } = bar

  return (
  <div>
    Hello world {quuz} {quz}
  </div>
  )
};`;

const ast = babylon.parse(sample, {
  sourceType: "module",
  plugins: ["jsx"]
});

console.log(JSON.stringify(ast, null, 2));
