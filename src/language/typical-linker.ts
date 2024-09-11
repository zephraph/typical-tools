import {
  AstNodeDescription,
  AstUtils,
  DefaultLinker,
  DocumentState,
  LinkingError,
  ReferenceInfo,
} from "langium";
import { isCustomType, Schema } from "./generated/ast.js";
import { extractModuleFromImport } from "./utils.js";

export class TypicalLinker extends DefaultLinker {
  protected override createLinkingError(
    refInfo: ReferenceInfo,
    targetDescription?: AstNodeDescription
  ): LinkingError {
    const document = AstUtils.getDocument(refInfo.container);
    if (document.state < DocumentState.ComputedScopes) {
      console.warn(
        `Attempted reference resolution before document reached ComputedScopes state (${document.uri}).`
      );
    }
    if (isCustomType(refInfo.container)) {
      const module = refInfo.container.module;
      if (!module) {
        return {
          ...refInfo,
          message: `Type '${refInfo.reference.$refText}' is not defined.`,
          targetDescription,
        };
      }
      const schema = document.parseResult.value as Schema;
      const path = schema.imports.find(
        (i) => extractModuleFromImport(i) === module
      )?.path;

      return {
        ...refInfo,
        message: `Type '${refInfo.reference.$refText}' is not defined${
          path ? " in imported schema " + path : ""
        }.`,
        targetDescription,
      };
    }
    const referenceType = this.reflection.getReferenceType(refInfo);
    return {
      ...refInfo,
      message: `Could not resolve reference to ${referenceType} named '${refInfo.reference.$refText}'.`,
      targetDescription,
    };
  }
}
