import { readFileSync, writeFileSync } from "fs";
import * as vscode from "vscode";

import CollectionsProvider from "../collections";
import { COMMAND, MESSAGE, NAME, TYPE } from "../constants";
import EnvironmentsProvider from "../environments";
import RequestHistoryProvider from "../request-history";
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
  resolveTableData,
  resolveVariable,
} from "../utils";
import getTokenColors from "../utils/getTokenColors";
import { IParameterKeyValueData, IRequestHeaderInformation, IRequestObject, ITableData, ITableRow } from "../utils/type";

class MainWebviewPanel {
  private url: string = "";
  private body: string | FormData | URLSearchParams = "";
  private method: string = "";
  private headers: IRequestHeaderInformation = { key: "" };
  public mainPanel: vscode.WebviewPanel | null = null;
  private id: string | undefined;
  private parentId: string | undefined;
  private requestName: string | undefined;
  private extensionUri;
  private requestHistoryProvider;
  private collectionsProvider;
  private environmentsProvider;
  public manageTokenPanel: vscode.WebviewPanel | null = null;

  private get tokenPath() {
    return getHomePath("oauth2-tokens.json");
  }

  constructor(
    extensionUri: vscode.Uri,
    requestHistoryProvider: RequestHistoryProvider,
    collectionsProvider: CollectionsProvider,
    environmentsProvider: EnvironmentsProvider,
  ) {
    this.extensionUri = extensionUri;
    this.requestHistoryProvider = requestHistoryProvider;
    this.collectionsProvider = collectionsProvider;
    this.environmentsProvider = environmentsProvider;
  }

  initializeWebview(id?: string, parentId?: string, requestName?: string) {
    this.id = id;
    this.parentId = parentId;
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
      ({ requestId, tokenRequest, codeChallenge, newTokenList, errorMsg, fileRowIndex, requestData, command }) => {
        if (command === COMMAND.ALERT_COPY) {
          vscode.window.showInformationMessage(MESSAGE.COPY_SUCCESFUL_MESSAGE);
          return;
        }

        if (command === COMMAND.SHOW_ERROR) {
          vscode.window.showErrorMessage(errorMsg);
          return;
        }

        if (command === COMMAND.INIT_REQUEST) {
          const requestItem = this.parentId
            ? this.collectionsProvider.getRequest(requestId)
            : this.requestHistoryProvider.getItemById(requestId);
          
          if (this.mainPanel && requestItem) {
            this.mainPanel.webview.postMessage({
              type: TYPE.TREEVIEW_DATA,
              ...requestItem.request.requestObject
            });
          }
          return;
        }

        if (command === COMMAND.INIT_ACTIVE_ENV) {
          this.mainPanel?.webview.postMessage({
            type: TYPE.ENV_DATA,
            variables: this.environmentsProvider.activeVariables
          });
          return;
        }

        if (command === COMMAND.INIT_CONFIG) {
          const configObject = {
            type: COMMAND.HAS_CONFIG,
            themeKind: vscode.window.activeColorTheme.kind,
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
          return;
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

        if (command === COMMAND.SELECT_FILE) {
          vscode.window.showOpenDialog().then((uri) => {
            if (uri && uri.length > 0) {
              const selectedPath = uri[0].fsPath;
              const data = readFileSync(selectedPath);

              if (this.mainPanel) {
                this.mainPanel.webview.postMessage({
                  type: COMMAND.FILE_SELECTED,
                  fileRowIndex,
                  path: selectedPath,
                  data: data.buffer,
                });
              }
            }
          });

          return;
        }

        if (!requestData?.requestUrl) {
          vscode.window.showWarningMessage(MESSAGE.WARNING_MESSAGE);
          return;
        }

        const {
          requestMethod,
          requestUrl,
          authOption,
          authData,
          bodyOption,
          bodyRawData,
          tableData,
          graphqlData,
        } = requestData;

        const variables = this.environmentsProvider.activeVariables;
        const resolvedUrl = resolveVariable(requestUrl, variables);
        const resolvedTableData = resolveTableData(tableData, variables);
        const flatTableData = Object.keys(tableData).reduce(
          (data, key) =>
            [...data, ...resolvedTableData[key as keyof ITableData].map((row) => ({ ...row, optionType: key }))],
          new Array<ITableRow & IParameterKeyValueData>
        );
        for (const row of flatTableData) {
          if (row.optionType === "formData" && row.isChecked && row.valueType === "File") {
            const filePath = row.filePath ?? "";
            const fileName = filePath.includes("/") ? filePath.split("/").at(-1) : filePath.split("\\").at(-1);
            row.value = new File([row.value], fileName ?? "unknown");
          }
        }

        this.url = getUrl(resolvedUrl);
        this.method = requestMethod;
        this.headers = getHeaders(flatTableData, authOption, authData);
        this.body = getBody(
          flatTableData,
          bodyOption,
          bodyRawData,
          graphqlData,
        );

        this.postWebviewMessage(requestData);
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
    const timestamp = new Date().getTime();

    if (responseObject && responseObject.type !== MESSAGE.ERROR) {
      if (this.mainPanel) {
        this.mainPanel.webview.postMessage(responseObject);
        requestObject.tableData.formData.forEach((row) => {
          if (row.valueType === "File") {
            row.value = "";
            delete row.filePath;
          }
        });

        if (this.parentId && this.requestName) {
          const newRequest = {
            id: this.id || crypto.randomUUID(),
            name: this.requestName,
            ...requestData,
            timestamp,
            requestObject,
          };
          this.collectionsProvider.addRequest(newRequest, this.parentId);
          this.id = newRequest.id;
        } else {
          this.requestHistoryProvider.add({
            id: crypto.randomUUID(),
            name: "",
            ...requestData,
            timestamp,
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
          <span id="request-id" style="display: none;">${this.id}</span>
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