import { expect, test } from "vitest";
import { expandToString as s } from "langium/generate";
import type { Diagnostic } from "vscode-languageserver-types";
import { init, expectDocumentValid } from "../utils";

test("check no errors", async () => {
  const { parse } = await init();
  const document = await parse(`
      struct Point {
        x: S64 = 0
        y: S64 = 1
      }
    `);

  expectDocumentValid(document);
  expect(
    document?.diagnostics?.map(diagnosticToString)?.join("\n")
  ).toHaveLength(0);
});

test("missing local type is invalid", async () => {
  const { parse } = await init();
  const document = await parse(`
      struct Point {
        x: number = 0
      }
    `);

  expectDocumentValid(document);
  expect(document?.diagnostics?.map(diagnosticToString)?.join("\n")).toEqual(
    expect.stringContaining(s`
          [2:11..2:17]: Type 'number' is not defined.
      `)
  );
});

test("missing imported type is invalid", async () => {
  const { parse } = await init({
    "coords.t": "struct Position { x: S64 = 0, y: S64 = 1 }",
  });
  const document = await parse(`
    import 'coords.t'

    struct Entity {
      position: coords.Position = 0
      location: coords.Location = 1
    }
  `);

  expectDocumentValid(document);
  expect(document?.diagnostics?.map(diagnosticToString)?.join("\n")).toEqual(
    expect.stringContaining(s`
          [5:23..5:31]: Type 'Location' is not defined in imported schema 'coords.t'.
      `)
  );
});

function diagnosticToString(d: Diagnostic) {
  return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}
