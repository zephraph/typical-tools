import { expect, test } from "vitest";
import { EmptyFileSystemProvider, FileSystemProvider } from "langium";
import { parseHelper } from "langium/test";
import { createTypicalServices } from "../../src/language/typical-module.js";
import { Schema } from "../../src/language/generated/ast.js";

const init = (fs?: FileSystemProvider) => {
  const services = createTypicalServices({
    fileSystemProvider: () => fs ?? new EmptyFileSystemProvider(),
  });
  const parse = parseHelper<Schema>(services.Typical);
  return { services, parse };
};

test("parse struct", async () => {
  const { parse } = init();
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
  const { parse } = init();
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
  const { parse } = init();
  const document = await parse(`
    import 'coords.t'

    struct Entity {
        position: coords.Position = 0
    }

    choice Move {
        up = 0
        down = 1
        left = 2
        right = 3
    }
  `);

  expect(document.parseResult.lexerErrors).toHaveLength(0);
  expect(document.parseResult.parserErrors).toHaveLength(0);
});
