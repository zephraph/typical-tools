import { type ValidationAcceptor, type ValidationChecks } from "langium";
import {
  type TypicalAstType,
  type Import,
  type Declaration,
  type Field,
  type Deleted,
  isImportedType,
  Schema,
} from "./generated/ast.js";
import type { TypicalServices } from "./typical-module.js";
import { dirname, join } from "path";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TypicalServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.TypicalValidator;
  const checks: ValidationChecks<TypicalAstType> = {
    Import: validator.validateImport,
    Declaration: [validator.uniqueDeclaration],
    Field: [
      validator.uniqueIndex,
      validator.noDeletedField,
      validator.importedTypeExists,
    ],
    Deleted: [validator.noUsedDeleted],
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class TypicalValidator {
  constructor(private services: TypicalServices) {}

  validateImport(imp: Import, accept: ValidationAcceptor): void {
    this.importExists(imp, accept) &&
      this.uniqueImport(imp, accept) &&
      this.importUsed(imp, accept);
  }

  private uniqueImport(imp: Import, accept: ValidationAcceptor): boolean {
    // We want to check all imports before the current one.
    const { imports } = imp.$container;
    const impIndex = imports.indexOf(imp);
    for (let i = 0; i < impIndex; i++) {
      if (imports[i].path === imp.path) {
        accept(
          "error",
          `Duplicate import of ${imp.path.replace(".t'", "'")}.`,
          {
            node: imp,
          }
        );
        return false;
      }
      if (imp.alias && imp.alias === imports[i].alias) {
        accept("error", `Duplicate import alias of ${imp.alias}.`, {
          node: imp,
          property: "alias",
        });
        return false;
      }
    }
    return true;
  }

  private importExists(imp: Import, accept: ValidationAcceptor): boolean {
    const importPath = imp.path.slice(1, -1);
    if (!importPath.endsWith(".t")) {
      accept("error", `Import path must end with .t`, {
        node: imp,
        property: "path",
      });
      return false;
    }
    const currentUri = imp.$container.$document!.uri;
    const importUri = currentUri.with({
      path: join(dirname(currentUri.path), ".", importPath),
    });

    const hasImport =
      this.services.shared.workspace.LangiumDocuments.hasDocument(importUri);

    if (!hasImport) {
      accept("error", `File ${imp.path} does not exist.`, {
        node: imp,
        property: "path",
      });
      return false;
    }
    return true;
  }

  private importUsed(imp: Import, accept: ValidationAcceptor): boolean {
    const importIdent = imp.alias
      ? imp.alias
      : imp.path.slice(1, -1).split("/").pop()?.slice(0, -2);
    if (!importIdent) return false;

    for (const decl of imp.$container.declarations) {
      for (const field of decl.fields) {
        if (isImportedType(field.type) && field.type.module === importIdent) {
          return true;
        }
      }
    }
    accept("warning", `Import not used.`, {
      node: imp,
      property: imp.alias ? "alias" : "path",
    });
    return true;
  }

  uniqueDeclaration(decl: Declaration, accept: ValidationAcceptor): void {
    for (const d of decl.$container.declarations) {
      if (d === decl) continue;
      if (d.name === decl.name) {
        accept("error", `Duplicate declaration of ${decl.name}.`, {
          node: decl,
        });
      }
    }
  }

  uniqueIndex(field: Field, accept: ValidationAcceptor): void {
    for (const f of field.$container.fields) {
      if (f === field) continue;
      if (f.index === field.index) {
        accept("error", `Index ${field.index} is already used by ${f.name}.`, {
          node: field,
          property: "index",
        });
      }
    }
  }

  noDeletedField(field: Field, accept: ValidationAcceptor): void {
    const deletedIndexes = field.$container.deleted.flatMap(
      ({ indexes }) => indexes
    );
    if (deletedIndexes.includes(field.index)) {
      accept("error", `Index ${field.index} should be deleted.`, {
        node: field,
      });
    }
  }

  importedTypeExists(field: Field, accept: ValidationAcceptor): void {
    if (isImportedType(field.type)) {
      const { module, type } = field.type;
      const currentUri = field.$container.$container.$document!.uri;

      // Find the matching import
      const matchingImport = field.$container.$container.imports.find(
        (imp) =>
          imp.alias === module ||
          imp.path.slice(1, -1).split("/").pop()?.slice(0, -2) === module
      );

      if (!matchingImport) {
        accept("error", `Import for module '${module}' not found.`, {
          node: field,
          property: "type",
        });
        return;
      }

      // Get the imported document
      const importPath = matchingImport.path.slice(1, -1);
      const importUri = currentUri.with({
        path: join(dirname(currentUri.path), ".", importPath),
      });
      const importedDocument =
        this.services.shared.workspace.LangiumDocuments.getDocument(importUri);

      if (!importedDocument) {
        accept("error", `Imported file ${importPath} not found.`, {
          node: field,
          property: "type",
        });
        return;
      }

      console.log("declarations", importedDocument.parseResult.value);
      // Check if the type exists in the imported document
      const typeExists = (
        importedDocument.parseResult.value as Schema
      ).declarations.some((decl) => decl.name === type);

      if (!typeExists) {
        accept(
          "error",
          `Type '${type}' not found in imported module '${module}'.`,
          { node: field, property: "type" }
        );
      }
    }
  }

  noUsedDeleted(deleted: Deleted, accept: ValidationAcceptor): void {
    deleted.$container.fields.forEach(({ name, index }) => {
      const match = deleted.indexes.indexOf(index);
      if (match !== -1) {
        accept(
          "warning",
          `Index ${index} is still being referenced by ${name}.`,
          {
            node: deleted,
            property: "indexes",
            index: match,
          }
        );
      }
    });
  }
}
