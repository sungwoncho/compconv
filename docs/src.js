const compconv = require("../dist/convert").default;

/**** DOM */
const codeInputEl = document.getElementById("code-input");
const outputEl = document.getElementById("output");
const convertButtonEl = document.getElementById("convert-button");

convertButtonEl.addEventListener("click", function(e) {
  const input = codeInputEl.value;

  let output;
  try {
    output = compconv(input);
  } catch (e) {
    output = e.message;
  }

  outputEl.innerText = output;
  hljs.highlightBlock(outputEl);
});
