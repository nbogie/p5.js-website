import { expect, test } from "vitest";
import { rewriteRelativeMdLinks } from "../../src/scripts/utils";

test("rewriteRelativeMdLinks", () => {
  expect(
    rewriteRelativeMdLinks(`
  # Title
  
  You can find more examples [here](https://p5xjs.org/examples.html) and
  in the [guide](./the-guide.md).
  
  ![image](./assets/image.jpg)
  
  ## Related Docs
  - See [Access](./access.md).
  - [Other](./folder/document.md)
  - [Other](folder/document.md)
  - [lol](./some-where-else/wow/)
  - [absolute](/wow/)
  - [no trailing slash](../test)
  - [external](https://p5js.org/)
  - [List of screen readers](https://en.wikipedia.org/wiki/List_of_screen_readers)
  - [Access - github](https://github.com/processing/p5.js/blob/main/contributor_docs/access.md)
  `),
  ).toEqual(`
  # Title
  
  You can find more examples [here](https://p5xjs.org/examples.html) and
  in the [guide](../the-guide/).
  
  ![image](./assets/image.jpg)
  
  ## Related Docs
  - See [Access](../access/).
  - [Other](../folder/document/)
  - [Other](../folder/document/)
  - [lol](../some-where-else/wow/)
  - [absolute](/wow/)
  - [no trailing slash](../test/)
  - [external](https://p5js.org/)
  - [List of screen readers](https://en.wikipedia.org/wiki/List_of_screen_readers)
  - [Access - github](https://github.com/processing/p5.js/blob/main/contributor_docs/access.md)
    `);
});
