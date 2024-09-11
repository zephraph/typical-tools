import { test } from "vitest";
import { init, expectDocumentValid } from "../utils";

test("same file links", async () => {
  const { parse } = await init();
  const document = await parse(`
    struct Ball {
        position: Point = 0
    }
    struct Point {
        x: U64 = 0
        y: U64 = 0
    }
  `);

  expectDocumentValid(document);
});

test("imported file links", async () => {
  const { parse } = await init({
    "coords.t": "struct Position { x: S64 = 0, y: S64 = 1 }",
  });
  const document = await parse(`
    import 'coords.t'

    struct Entity {
      position: coords.Position = 0
    }
  `);

  expectDocumentValid(document);
});
