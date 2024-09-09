import { AstNode } from "langium";
import {
  AbstractSemanticTokenProvider,
  SemanticTokenAcceptor,
} from "langium/lsp";
import { isCustomType, isDeclaration, isImport } from "./generated/ast.js";
import { SemanticTokenTypes } from "vscode-languageserver";

export class TypicalSemanticTokenProvider extends AbstractSemanticTokenProvider {
  protected override highlightElement(
    node: AstNode,
    acceptor: SemanticTokenAcceptor
  ): void | undefined | "prune" {
    if (isImport(node)) {
      acceptor({
        node,
        property: "alias",
        type: SemanticTokenTypes.class,
      });
      acceptor({
        node,
        property: "path",
        type: SemanticTokenTypes.string,
      });
      return;
    }

    if (isCustomType(node)) {
      acceptor({
        node,
        property: "module",
        type: SemanticTokenTypes.class,
      });
      acceptor({
        node,
        property: "type",
        type: SemanticTokenTypes.variable,
      });
      return;
    }

    if (isDeclaration(node)) {
      acceptor({
        node,
        property: "name",
        type: SemanticTokenTypes.variable,
      });
      return;
    }
  }
}
