import * as vscode from 'vscode';

import CollectionsProvider from './collections';
import { RequestCollection, RequestCollectionItem } from './collections/tree-items';
import { COMMAND, MESSAGE, TYPE } from "./constants";
import RequestHistoryProvider from './request-history';
import { RequestHistoryTreeItem } from './request-history/tree-items';
import MainWebviewPanel from './panels/main';
import getTokenColors from './utils/getTokenColors';
import ManageTokenWebviewPanel from './panels/manage-tokens';

export async function activate(context: vscode.ExtensionContext) {
	const requestHistoryProvider = new RequestHistoryProvider(context);
	const collectionsProvider = new CollectionsProvider(context);

	const mainWebviewProvider = new MainWebviewPanel(
		context.extensionUri,
		requestHistoryProvider,
		collectionsProvider
	);
	const manageTokenWebviewProvider = new ManageTokenWebviewPanel(context.extensionUri);

	let currentMainPanel: vscode.WebviewPanel | null = null;
	let currentManageTokenPanel: vscode.WebviewPanel | null = null;

	const handleInputName = async () => {
		const inputName = await vscode.window.showInputBox({
			placeHolder: "New name",
			validateInput: (value) => !value.trim() ? MESSAGE.NAME_EMPTY : null,
		});
		if (!inputName) {
			return;
		}
		return inputName.trim();
	};

	const initializePanel = (collectionName?: string, requestName?: string, id?: string) => {
		currentMainPanel = mainWebviewProvider.initializeWebview(id, collectionName, requestName);
		manageTokenWebviewProvider.mainPanel = currentMainPanel;

		mainWebviewProvider.mainPanel?.onDidDispose(() => {
			manageTokenWebviewProvider.mainPanel = null;
			currentMainPanel = null;
		}, null);
	};

	const disp_requestHistoryTreeView = vscode.window.createTreeView(
		"apiTesterRequestHistoryTreeView",
		{
			treeDataProvider: requestHistoryProvider,
			showCollapseAll: true
		}
	);

	const disp_collectionsTreeView = vscode.window.createTreeView(
		"apiTesterCollectionsTreeView",
		{
			treeDataProvider: collectionsProvider,
			showCollapseAll: true
		}
	);

	const disp_newRequestCmd = vscode.commands.registerCommand(
		COMMAND.NEW_REQUEST,
		() => initializePanel()
	);

	const disp_openRequestCmd = vscode.commands.registerCommand(
		COMMAND.OPEN_REQUEST,
		(item: RequestHistoryTreeItem | RequestCollectionItem) => {
			if (item instanceof RequestCollectionItem) {
				initializePanel(item.parent.name, item.request.name, item.id);
			} else {
				initializePanel();
			}

			currentMainPanel?.webview.postMessage({
				type: TYPE.TREEVIEW_DATA,
				...item.request.requestObject,
			});
		}
	);

	const disp_deleteRequestCmd = vscode.commands.registerCommand(
		COMMAND.DELETE_REQUEST,
		(item: RequestHistoryTreeItem) => {
			requestHistoryProvider.delete(item);
		}
	);

	const disp_renameRequestCmd = vscode.commands.registerCommand(
		COMMAND.RENAME_REQUEST,
		async (item: RequestHistoryTreeItem) => {
			const requestName = await handleInputName();
			if (!requestName) {
				return;
			}

			const newRequest = { ...item.request, name: requestName };
			requestHistoryProvider.delete(item);
			requestHistoryProvider.add(newRequest);
		}
	);

	const disp_saveToCollectionCmd = vscode.commands.registerCommand(
		COMMAND.SAVE_TO_COLLECTION,
		async (item: RequestHistoryTreeItem) => {
			const collectionName = await vscode.window.showQuickPick(
				collectionsProvider.collectionNames,
				{
					placeHolder: "Select a collection",
					canPickMany: false
				}
			);

			if (collectionName) {
				collectionsProvider.add(collectionName, item.request);
			}
		}
	);

	const disp_refreshCmd = vscode.commands.registerCommand(
		COMMAND.REFRESH,
		() => {
			requestHistoryProvider.refresh();
			collectionsProvider.refresh();
		}
	);

	const disp_clearHistoryCmd = vscode.commands.registerCommand(
		COMMAND.CLEAR_HISTORY,
		async () => {
			const action = await vscode.window.showWarningMessage(
				MESSAGE.CLEAR_HISTORY_REMINDER,
				MESSAGE.YES,
				MESSAGE.NO
			);
			if (action === MESSAGE.YES) {
				requestHistoryProvider.clear();
				await vscode.window.showInformationMessage(MESSAGE.HISTORY_DELETION_COMPLETE);
			}
		}
	);

	const disp_newCollectionCmd = vscode.commands.registerCommand(
		COMMAND.NEW_COLLECTION,
		async () => {
			const collectionName = await handleInputName();
			if (!collectionName) {
				return;
			}
			if (collectionsProvider.isCollectionExist(collectionName)) {
				await vscode.window.showInformationMessage(MESSAGE.COLLECTION_EXISTS);
				return;
			}
			collectionsProvider.add(collectionName);
		}
	);

	const disp_renameCollectionCmd = vscode.commands.registerCommand(
		COMMAND.RENAME_COLLECTION,
		async (collection: RequestCollection) => {
			const newName = await handleInputName();
			if (!newName) {
				return;
			}
			if (collectionsProvider.isCollectionExist(newName)) {
				await vscode.window.showInformationMessage(MESSAGE.COLLECTION_EXISTS);
				return;
			}
			collectionsProvider.renameCollection(collection.name, newName);
		}
	);

	const disp_deleteCollectionCmd = vscode.commands.registerCommand(
		COMMAND.DELETE_COLLECTION,
		async (collection: RequestCollection) => {
			const action = await vscode.window.showWarningMessage(
				MESSAGE.DELETE_COLLECTION_REMINDER,
				MESSAGE.YES,
				MESSAGE.NO
			);
			if (action === MESSAGE.YES) {
				collectionsProvider.delete(collection);
			}
		}
	);

	const disp_newCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.NEW_COLLECTION_REQUEST,
		async (collection: RequestCollection) => {
			const requestName = await handleInputName();
			if (!requestName) {
				return;
			}
			initializePanel(collection.name, requestName);
		}
	);

	const disp_clearCollectionItemsCmd = vscode.commands.registerCommand(
		COMMAND.CLEAR_COLLECTION_ITEMS,
		(collection: RequestCollection) => {
			collectionsProvider.clearItems(collection.name);
		}
	);

	const disp_renameCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.RENAME_COLLECTION_REQUEST,
		async (requestItem: RequestCollectionItem) => {
			const collectionName = requestItem.parent.name;
			const newRequestName = await handleInputName();
			if (!newRequestName) {
				return;
			}
			collectionsProvider.renameItem(collectionName, requestItem.id!, newRequestName);
		}
	);

	const disp_deleteCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.DELETE_COLLECTION_REQUEST,
		(requestItem: RequestCollectionItem) => {
			collectionsProvider.delete(requestItem);
		}
	);

	const disp_manageTokensCmd = vscode.commands.registerCommand(
		COMMAND.MANAGE_TOKENS,
		() => {
			if (currentManageTokenPanel) {
				currentManageTokenPanel.reveal(vscode.ViewColumn.One);
			} else {
				currentManageTokenPanel = manageTokenWebviewProvider.initializeWebview();
				mainWebviewProvider.manageTokenPanel = currentManageTokenPanel;

				if (manageTokenWebviewProvider.manageTokenPanel) {
					manageTokenWebviewProvider.manageTokenPanel.onDidDispose(() => {
						mainWebviewProvider.manageTokenPanel = null;
						currentManageTokenPanel = null;
					}, null);
				}
			}
		}
	);

	const disp_onThemeChangeHandler = vscode.window.onDidChangeActiveColorTheme(() => {
		if (currentMainPanel) {
			const themeName: string = vscode.workspace.getConfiguration("workbench").get("colorTheme") || "";
			const tokenColors = getTokenColors(themeName);
			currentMainPanel.webview.postMessage({ tokenColors, type: TYPE.THEME_CHANGED });
		}
	});

	const disp_uriHandler = vscode.window.registerUriHandler({
		handleUri(uri) {
			// URI format: vscode://undefined_publisher.api-tester?...
			const queryParams = new URLSearchParams(uri.query);

			const paramError = queryParams.get("error");
			if (paramError) {
				const paramErrorDesc = queryParams.get("error_description");
				const paramErrorUri = queryParams.get("error_uri");
				vscode.window.showErrorMessage(`Authorization failed: ${paramError} (${paramErrorDesc}) [${paramErrorUri}]`);
				return;
			}

			const paramCode = queryParams.get("code");
			if (paramCode) {
				currentMainPanel?.webview.postMessage({
					type: COMMAND.OAUTH2_TOKEN_RESPONSE,
					code: paramCode
				});
			} else {
				vscode.window.showErrorMessage("Authorization code not found");
			}
		},
	});

	// Subscribe tree views
	context.subscriptions.push(disp_requestHistoryTreeView);
	context.subscriptions.push(disp_collectionsTreeView);

	// Subscribe commands
	context.subscriptions.push(disp_newRequestCmd);
	context.subscriptions.push(disp_openRequestCmd);
	context.subscriptions.push(disp_deleteRequestCmd);
	context.subscriptions.push(disp_renameRequestCmd);
	context.subscriptions.push(disp_saveToCollectionCmd);

	context.subscriptions.push(disp_refreshCmd);
	context.subscriptions.push(disp_clearHistoryCmd);

	context.subscriptions.push(disp_newCollectionCmd);
	context.subscriptions.push(disp_renameCollectionCmd);
	context.subscriptions.push(disp_deleteCollectionCmd);
	context.subscriptions.push(disp_newCollectionRequestCmd);
	context.subscriptions.push(disp_clearCollectionItemsCmd);
	context.subscriptions.push(disp_renameCollectionRequestCmd);
	context.subscriptions.push(disp_deleteCollectionRequestCmd);

	context.subscriptions.push(disp_manageTokensCmd);

	// Subscribe handlers
	context.subscriptions.push(disp_onThemeChangeHandler);
	context.subscriptions.push(disp_uriHandler);
}

export function deactivate() { }
