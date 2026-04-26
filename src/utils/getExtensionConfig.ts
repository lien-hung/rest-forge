import * as vscode from "vscode";
import { IExtensionConfig } from "./type";

function getExtensionConfig(): IExtensionConfig {
  const workspaceConfig = vscode.workspace.getConfiguration("rest-forge");

  // Custom request methods
  const customMethods = workspaceConfig
    .get("customMethods", new Array<string>())
    .map(method => method.toUpperCase());

  return { customMethods };
}

export default getExtensionConfig;