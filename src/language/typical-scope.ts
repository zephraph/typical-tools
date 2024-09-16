import {
  AstNode,
  AstNodeDescription,
  AstUtils,
  DefaultScopeComputation,
  DefaultScopeProvider,
  EMPTY_SCOPE,
  LangiumDocument,
  ReferenceInfo,
  Scope,
} from "langium";
import { Declaration, isCustomType, Schema } from "./generated/ast.js";
import { extractModuleFromImport } from "./utils.js";
import { dirname, join } from "path";

export class TypicalScopeComputation extends DefaultScopeComputation {
  override async computeExports(
    document: LangiumDocument<AstNode>
  ): Promise<AstNodeDescription[]> {
    const schema = document.parseResult.value as Schema;
    return schema.declarations
      .filter((d) => d.name)
      .map((d) => this.descriptions.createDescription(d, d.name));
  }
}

export class TypicalScopeProvider extends DefaultScopeProvider {
  override getScope(context: ReferenceInfo): Scope {
    if (isCustomType(context.container) && context.container.module) {
      const { module } = context.container;
      return this.resolveImportedScope(context, module);
    }
    return EMPTY_SCOPE;
  }

  private resolveImportedScope(context: ReferenceInfo, module: string): Scope {
    const document = AstUtils.getDocument(context.container);
    const schema = document.parseResult.value as Schema;
    for (const imp of schema.imports) {
      const importModule = extractModuleFromImport(imp);
      if (importModule === module) {
        const currentUri = document.uri;
        const currentDir = dirname(currentUri.path);
        const importUri = join(currentDir, imp.path.slice(1, -1));
        const uri = currentUri.with({ path: importUri });
        return this.createScope(
          this.indexManager.allElements(Declaration, new Set([uri.toString()]))
        );
      }
    }
    return EMPTY_SCOPE;
  }
}
