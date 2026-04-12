import * as vscode from "vscode";
import { COMMAND, MESSAGE, NAME, TYPE } from "../constants";
import { getNonce } from "../utils";
import EnvironmentsProvider from "../environments";
import { IEnvironmentTreeItemState } from "../utils/type";

class ManageEnvironmentPanel {
  public manageEnvPanel: vscode.WebviewPanel | null = null;
  private extensionUri;
  private environmentsProvider;
  private envName: string | undefined;

  constructor(
    extensionUri: vscode.Uri,
    environmentsProvider: EnvironmentsProvider
  ) {
    this.extensionUri = extensionUri;
    this.environmentsProvider = environmentsProvider;
  }

  initializeWebview(envName: string) {
    this.envName = envName;
    this.manageEnvPanel = vscode.window.createWebviewPanel(
      TYPE.WEBVIEW_TYPE,
      `${NAME.MANAGE_ENV_PANEL_NAME}: ${envName}`,
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

    this.manageEnvPanel.webview.html = this.getHtmlForWebview(this.manageEnvPanel.webview);

    this.manageEnvPanel.iconPath = vscode.Uri.joinPath(
      this.extensionUri,
      "icons/images/apitester-icon.png",
    );

    this.manageEnvPanel.onDidDispose(() => { this.manageEnvPanel = null; }, null);

    this.receiveWebviewMessage();

    return this.manageEnvPanel;
  }

  private receiveWebviewMessage() {
    if (!this.manageEnvPanel) {
      return;
    }

    this.manageEnvPanel.webview.onDidReceiveMessage(({ command, envName, envData }) => {
      if (command === COMMAND.INIT_VARIABLES) {
        const envItem = this.environmentsProvider.getByName(envName);
        this.manageEnvPanel?.webview.postMessage({
          type: COMMAND.HAS_VARIABLES,
          envName: envItem?.data.name,
          variables: envItem?.data.variables ?? []
        });
        return;
      }

      if (command === COMMAND.SET_VARIABLES) {
        const variables = envData.map((v: any) => ({ key: v.key, value: v.value }));
        const envState: IEnvironmentTreeItemState = { name: envName, variables };
        this.environmentsProvider.add(envState);
        vscode.window.showInformationMessage(MESSAGE.SAVE_ENV_SUCCESSFUL);
        return;
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
          <title>API Tester - Manage Environment</title>
          <link href="${resetCssSrc}" rel="stylesheet">
          <link href="${mainStylesCssSrc}" rel="stylesheet">
        </head>
        <body>
          <div id="root"></div>
          <span id="env-name" style="display: none;">${this.envName}</span>
          <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
          </script>
          <script src="${scriptSrc}" nonce="${nonce}"></script>
        </body>
      </html>
    `;
  }
}

export default ManageEnvironmentPanel;