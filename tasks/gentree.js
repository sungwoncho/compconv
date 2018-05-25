const babylon = require("babylon");

const sample = `export default ({ foo, bar  }) => {
  return (
      <div>
          This is {foo} {bar}
      </div>
  );
};`;

const ast = babylon.parse(sample, {
  sourceType: "module",
  plugins: ["jsx"]
});

console.log(JSON.stringify(ast, null, 2));
