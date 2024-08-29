import type { ValidationAcceptor, ValidationChecks } from "langium";
import type {
  TypicalAstType,
  Import,
  Declaration,
  Field,
  Deleted,
} from "./generated/ast.js";
import type { TypicalServices } from "./typical-module.js";

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TypicalServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.TypicalValidator;
  const checks: ValidationChecks<TypicalAstType> = {
    Import: validator.uniqueImport,
    Declaration: [validator.uniqueDeclaration],
    Field: [validator.uniqueIndex, validator.noDeletedField],
    Deleted: [validator.noUsedDeleted],
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class TypicalValidator {
  uniqueImport(imp: Import, accept: ValidationAcceptor): void {
    for (const i of imp.$container.imports) {
      if (i === imp) continue;
      if (i.path === imp.path) {
        accept("error", `Duplicate import of ${imp.path}.`, { node: imp });
      }
      if (imp.alias && imp.alias === i.alias) {
        accept("error", `Duplicate import alias of ${imp.alias}.`, {
          node: imp,
        });
      }
    }
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
