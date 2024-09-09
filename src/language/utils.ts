import { basename } from "path";
import { Import } from "./generated/ast.js";

export const extractModuleFromImport = (importNode: Import): string => {
  return importNode.alias
    ? importNode.alias
    : basename(importNode.path.slice(1, -1), ".t");
};
