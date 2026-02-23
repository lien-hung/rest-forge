import * as vscode from "vscode";
import { writeFileSync } from "fs";

import { COMMAND, MESSAGE, NAME, TYPE } from "../constants";
import {
  authorizeInBrowser,
  generateResponseObject,
  getBody,
  getExtensionConfig,
  getHeaders,
  getHomePath,
  getNonce,
  getStoredOAuthTokens,
  getUrl,
} from "../utils";
import { IParameterKeyValueData, IRequestHeaderInformation, IRequestObject } from "../utils/type";
import RequestHistoryProvider from "../request-history";
import CollectionsProvider from "../collections";
import getTokenColors from "../utils/getTokenColors";

class MainWebviewPanel {
  private url: string = "";
  private body: string | FormData | URLSearchParams = "";
  private method: string = "";
  private headers: IRequestHeaderInformation = { key: "" };
  public mainPanel: vscode.WebviewPanel | null = null;
  private id: string | undefined;
  private collectionName: string | undefined;
  private requestName: string | undefined;
  private extensionUri;
  private requestHistoryProvider;
  private collectionsProvider;
  public manageTokenPanel: vscode.WebviewPanel | null = null;

  private get tokenPath() {
    return getHomePath("oauth2-tokens.json");
  }

  constructor(
    extensionUri: vscode.Uri,
    requestHistoryProvider: RequestHistoryProvider,
    collectionsProvider: CollectionsProvider,
  ) {
    this.extensionUri = extensionUri;
    this.requestHistoryProvider = requestHistoryProvider;
    this.collectionsProvider = collectionsProvider;
  }

  initializeWebview(id?: string, collectionName?: string, requestName?: string) {
    this.id = id;
    this.collectionName = collectionName;
    this.requestName = requestName;

    if (this.mainPanel) {
      this.mainPanel.reveal(vscode.ViewColumn.One);
      this.mainPanel.title = requestName || NAME.MAIN_PANEL_NAME;
      return this.mainPanel;
    }

    this.mainPanel = vscode.window.createWebviewPanel(
      TYPE.WEBVIEW_TYPE,
      requestName || NAME.MAIN_PANEL_NAME,
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

    this.mainPanel.webview.onDidReceiveMessage(
      ({
        tokenRequest,
        codeChallenge,
        newTokenList,
        errorMsg,
        requestMethod,
        requestUrl,
        authOption,
        authData,
        oauth2Data,
        bodyOption,
        bodyRawOption,
        bodyRawData,
        tableData,
        command
      }) => {
        if (command === COMMAND.ALERT_COPY) {
          vscode.window.showInformationMessage(MESSAGE.COPY_SUCCESFUL_MESSAGE);
          return;
        }

        if (command === COMMAND.SHOW_ERROR) {
          vscode.window.showErrorMessage(errorMsg);
          return;
        }

        if (command === COMMAND.INIT_CONFIG) {
          const configObject = {
            type: COMMAND.HAS_CONFIG,
            config: getExtensionConfig()
          };

          if (this.mainPanel) {
            this.mainPanel.webview.postMessage(configObject);
          }
          return;
        }

        if (command === COMMAND.INIT_TOKEN_COLORS) {
          const themeName: string = vscode.workspace.getConfiguration("workbench").get("colorTheme") || "";
          const tokenColors = getTokenColors(themeName);

          const tokenColorsObject = {
            type: COMMAND.HAS_TOKEN_COLORS,
            tokenColors
          };

          if (this.mainPanel) {
            this.mainPanel.webview.postMessage(tokenColorsObject);
          }
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

        if (command === COMMAND.OAUTH2_TOKEN_REQUEST) {
          authorizeInBrowser(tokenRequest, codeChallenge);
          return;
        }

        if (command === COMMAND.SET_OAUTH2_TOKENS) {
          writeFileSync(this.tokenPath, JSON.stringify(newTokenList));
          if (this.manageTokenPanel) {
            this.manageTokenPanel.webview.postMessage({
              tokenList: newTokenList,
              type: COMMAND.HAS_OAUTH2_TOKENS
            });
          }
          return;
        }

        if (command === COMMAND.OAUTH2_TOKEN_ADDED) {
          vscode.window.showInformationMessage("Access token added successfully");
          return;
        }

        if (command === COMMAND.OPEN_MANAGE_TOKENS) {
          vscode.commands.executeCommand(COMMAND.MANAGE_TOKENS);
          return;
        }

        if (requestUrl.length === 0) {
          vscode.window.showWarningMessage(MESSAGE.WARNING_MESSAGE);
          return;
        }

        const requestObject: IRequestObject = {
          requestMethod,
          requestUrl,
          authOption,
          authData,
          oauth2Data,
          bodyOption,
          bodyRawOption,
          bodyRawData,
          tableData,
        };
        const flatTableData = Object.keys(tableData).reduce(
          (data, key) => [...data, ...tableData[key].map((row: any) => ({ ...row, optionType: key }))],
          new Array<IParameterKeyValueData>
        );

        // Convert string (base64) to blob for form data
        flatTableData.forEach((row) => {
          if (row.optionType === TYPE.BODY_FORM_DATA && row.isChecked && row.valueType === "File") {
            fetch(row.value)
              .then(res => res.blob())
              .then(blob => row.value = blob);
          }
        });

        this.url = getUrl(requestUrl);
        this.method = requestMethod;
        this.headers = getHeaders(flatTableData, authOption, authData);
        this.body = getBody(
          flatTableData,
          bodyOption,
          bodyRawOption,
          bodyRawData
        );

        this.postWebviewMessage(requestObject);
      },
    );
  }

  private async postWebviewMessage(requestObject: IRequestObject) {
    const requestData = {
      url: this.url,
      method: this.method,
      headers: this.headers,
      body: this.body,
    };

    const responseObject = await generateResponseObject(requestData);
    const requestedTime = new Date().getTime();

    if (responseObject && responseObject.type !== MESSAGE.ERROR) {
      if (this.mainPanel) {
        this.mainPanel.webview.postMessage(responseObject);
        requestObject.tableData["Form Data"].forEach((row) => {
          if (row.valueType === "File") {
            row.value = "";
          }
        });

        if (this.collectionName && this.requestName) {
          const newRequest = {
            ...requestData,
            requestedTime,
            id: this.id || crypto.randomUUID(),
            name: this.requestName,
            requestObject,
          };
          this.collectionsProvider.add(this.collectionName, newRequest);
          this.id = newRequest.id;
        } else {
          this.requestHistoryProvider.add({
            ...requestData,
            requestedTime,
            id: crypto.randomUUID(),
            name: "",
            requestObject,
          });
        }
      }
    }
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
          <title>API Tester</title>
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

export default MainWebviewPanel;