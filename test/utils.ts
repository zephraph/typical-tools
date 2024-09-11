import { EmptyFileSystem, type LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { createTypicalServices } from "../src/language/typical-module.js";
import { Schema, isSchema } from "../src/language/generated/ast.js";
import { expandToString as s } from "langium/generate";
import { expect } from "vitest";

export const init = async (files?: Record<string, string>) => {
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

export function expectDocumentValid(document: LangiumDocument) {
  expect(document.parseResult.lexerErrors).toHaveLength(0);
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
