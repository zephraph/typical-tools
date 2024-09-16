import { expect, test } from "vitest";
import { init } from "../utils";

test("parse struct", async () => {
  const { parse } = await init();
  const document = await parse(`
    struct Point {
      x: S64 = 0
      y: S64 = 1
    }
  `);

  expect(document.parseResult.lexerErrors).toHaveLength(0);
  expect(document.parseResult.parserErrors).toHaveLength(0);
});

test("parse choice", async () => {
  const { parse } = await init();
  const document = await parse(`
    choice Option {
      no: Bool = 0
      yes: Bool = 1
    }
  `);

  expect(document.parseResult.lexerErrors).toHaveLength(0);
  expect(document.parseResult.parserErrors).toHaveLength(0);
});

test("full example with imports", async () => {
  const { parse } = await init();
  const document = await parse(`
    import 'coords.t'

    struct Entity {
        position: coords.Position = 0
    }

    choice Move {
        up = 0
        down: Bool = 1
        left: Bool = 2
        right: Bool = 3
    }
  `);

  expect(document.parseResult.lexerErrors).toHaveLength(0);
  expect(document.parseResult.parserErrors).toHaveLength(0);
});

test("decl without name shouldn't throw", async () => {
  const { parse } = await init();
  expect(parse(`struct`)).resolves.not.toThrowError();
});
