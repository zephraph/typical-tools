import { expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { expandToString as s } from "langium/generate";
import { parseHelper } from "langium/test";
import type { Diagnostic } from "vscode-languageserver-types";
import { createTypicalServices } from "../../src/language/typical-module.js";
import { Schema, isSchema } from "../../src/language/generated/ast.js";

const init = async (files?: Record<string, string>) => {
  const services = createTypicalServices(EmptyFileSystem);
  const doParse = parseHelper<Schema>(services.Typical);
  if (files) {
    for (const [uri, content] of Object.entries(files)) {
      services.shared.workspace.IndexManager.updateContent(
        await doParse(content, {
          validation: true,
          documentUri: uri,
        })
      );
    }
  }
  const parse = (input: string) => doParse(input, { validation: true });
  return { services, parse };
};

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

test.only("missing imported type is invalid", async () => {
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

function expectDocumentValid(document: LangiumDocument) {
  expect(
    (document.parseResult.parserErrors.length &&
      s`
        Parser errors:
          ${document.parseResult.parserErrors
            .map((e) => e.message)
            .join("\n  ")}
    `) ||
      (document.parseResult.value === undefined &&
        `ParseResult is 'undefined'.`) ||
      (!isSchema(document.parseResult.value) &&
        `Root AST object is a ${document.parseResult.value.$type}, expected a '${Schema}'.`) ||
      undefined
  ).toBeUndefined();
}

function diagnosticToString(d: Diagnostic) {
  return `[${d.range.start.line}:${d.range.start.character}..${d.range.end.line}:${d.range.end.character}]: ${d.message}`;
}
