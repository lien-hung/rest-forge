import { writeFileSync } from "fs";
import * as vscode from "vscode";

import { COMMAND, NAME, TYPE } from "../constants";
import {
  getHomePath,
  getNonce,
  getStoredOAuthTokens,
} from "../utils";

class ManageTokenWebviewPanel {
  public mainPanel: vscode.WebviewPanel | null = null;
  private extensionUri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  private get tokenPath() {
    return getHomePath("oauth2-tokens.json");
  }

  initializeWebview() {
    this.mainPanel = vscode.window.createWebviewPanel(
      TYPE.WEBVIEW_TYPE,
      NAME.MANAGE_TOKEN_PANEL_NAME,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.extensionUri, "media"),
          vscode.Uri.joinPath(this.extensionUri, "dist"),
        ],
      },
    );

    this.mainPanel.webview.html = this.getHtmlForWebview(this.mainPanel.webview);

    this.mainPanel.iconPath = vscode.Uri.joinPath(
      this.extensionUri,
      "icons/images/apitester-icon.png",
    );

    this.mainPanel.onDidDispose(() => { this.mainPanel = null; }, null);

    this.receiveWebviewMessage();

    return this.mainPanel;
  }

  private receiveWebviewMessage() {
    if (!this.mainPanel) {
      return;
    }

    this.mainPanel.webview.onDidReceiveMessage(({ command, newTokenList }) => {
      if (command === COMMAND.SET_OAUTH2_TOKENS) {
        writeFileSync(this.tokenPath, JSON.stringify(newTokenList));
        return;
      }

      if (command === COMMAND.INIT_OAUTH2_TOKENS) {
        try {
          const tokenList = getStoredOAuthTokens(this.tokenPath);
          const tokenListObject = { tokenList, type: COMMAND.HAS_OAUTH2_TOKENS };
          if (this.mainPanel) {
            this.mainPanel.webview.postMessage(tokenListObject);
          }
        } catch (error) {
          console.error("Error loading tokens: ", error);
        }
      }
    });
  }

  private getHtmlForWebview(panel: vscode.Webview) {
    const scriptPath = vscode.Uri.joinPath(
      this.extensionUri,
      "dist",
      "bundle.js",
    );
    const resetCssPath = vscode.Uri.joinPath(
      this.extensionUri,
      "media",
      "reset.css",
    );
    const vscodeStylesCssPath = vscode.Uri.joinPath(
      this.extensionUri,
      "media",
      "vscode.css",
    );

    const resetCssSrc = panel.asWebviewUri(resetCssPath);
    const mainStylesCssSrc = panel.asWebviewUri(vscodeStylesCssPath);
    const scriptSrc = panel.asWebviewUri(scriptPath);
    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>API Tester - Manage Tokens</title>
          <link href="${resetCssSrc}" rel="stylesheet">
          <link href="${mainStylesCssSrc}" rel="stylesheet">
        </head>
        <body>
          <div id="root"></div>
          <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
          </script>
          <script src="${scriptSrc}" nonce="${nonce}"></script>
        </body>
      </html>
    `;
  }
}

export default ManageTokenWebviewPanel;