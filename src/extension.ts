import * as vscode from 'vscode';

import CollectionsProvider from './collections';
import { RequestCollection, RequestFolder, RequestItem } from './collections/tree-items';
import { COMMAND, MESSAGE, TYPE } from "./constants";
import MainWebviewPanel from './panels/main';
import ManageTokenWebviewPanel from './panels/manage-tokens';
import RequestHistoryProvider from './request-history';
import { RequestHistoryTreeItem } from './request-history/tree-items';
import { parseCurl } from './utils';
import getTokenColors from './utils/getTokenColors';

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

	let requestInClipboard: RequestItem | null = null;

	const handleInput = async (placeHolder: string) => {
		const input = await vscode.window.showInputBox({ placeHolder });
		return input;
	};

	const handleInputName = async (defaultValue?: string) => {
		const inputName = await vscode.window.showInputBox({
			placeHolder: "New name",
			value: defaultValue,
			validateInput: (value) => !value.trim() ? MESSAGE.NAME_EMPTY : null,
		});
		return inputName;
	};

	const initializePanel = ({
		id,
		parentId,
		requestName
	}: {
		id?: string,
		parentId?: string,
		requestName?: string
	}) => {
		currentMainPanel = mainWebviewProvider.initializeWebview(id, parentId, requestName);
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
		() => initializePanel({})
	);

	const disp_openRequestCmd = vscode.commands.registerCommand(
		COMMAND.OPEN_REQUEST,
		(item: RequestHistoryTreeItem | RequestItem) => {
			const requestMessage = { type: TYPE.TREEVIEW_DATA, ...item.request.requestObject };
			if (!currentMainPanel) {
				setTimeout(() => currentMainPanel?.webview.postMessage(requestMessage), 1000);
			}

			if (item instanceof RequestItem) {
				initializePanel({ id: item.id, parentId: item.parent.id, requestName: item.request.name });
			} else {
				initializePanel({});
			}

			currentMainPanel?.webview.postMessage(requestMessage);
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
			const requestName = await handleInputName(item.request.name);
			if (!requestName) {
				return;
			}

			const newRequest = { ...item.request, name: requestName.trim() };
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
			const collection = collectionsProvider.getCollectionByName(collectionName);

			if (collection) {
				const requestName = await handleInputName();
				if (!requestName) {
					return;
				}

				item.request.name = requestName;
				collectionsProvider.addRequest(item.request, collection.id!);
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
			if (collectionsProvider.collectionNames.includes(collectionName.trim())) {
				await vscode.window.showInformationMessage(MESSAGE.COLLECTION_EXISTS);
				return;
			}
			collectionsProvider.addFolderLike(collectionName.trim());
		}
	);

	const disp_copyCollectionCmd = vscode.commands.registerCommand(
		COMMAND.COPY_COLLECTION,
		async (collection: RequestCollection) => {
			const collectionNames = collectionsProvider.collectionNames.filter(name => name !== collection.name);
			if (collectionNames.length === 0) {
				await vscode.window.showInformationMessage(MESSAGE.NO_COPYABLE_COLLECTION);
				return;
			}

			const destinationName = await vscode.window.showQuickPick(
				collectionNames,
				{
					placeHolder: "Select a collection",
					canPickMany: false,
				}
			);
			const destination = collectionsProvider.getCollectionByName(destinationName);
			if (destination) {
				collectionsProvider.copy(collection, destination);
			}
		}
	);

	const disp_duplicateCollectionCmd = vscode.commands.registerCommand(
		COMMAND.DUPLICATE_COLLECTION,
		(collection: RequestCollection) => collectionsProvider.duplicate(collection)
	);

	const disp_renameCollectionCmd = vscode.commands.registerCommand(
		COMMAND.RENAME_COLLECTION,
		async (collection: RequestCollection) => {
			const newName = await handleInputName(collection.name);
			if (!newName) {
				return;
			}
			if (collectionsProvider.collectionNames.includes(newName.trim())) {
				await vscode.window.showInformationMessage(MESSAGE.COLLECTION_EXISTS);
				return;
			}
			collectionsProvider.renameFolderLike(collection, newName.trim());
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

	const disp_exportCollectionCmd = vscode.commands.registerCommand(
		COMMAND.EXPORT_COLLECTION,
		(collection: RequestCollection) => {
			vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(`collection_${collection.name.replace(/[/\\?%*:|"<>]/g, '-')}.json`)
			}).then((uri) => {
				if (uri) {
					const exportPath = uri.fsPath;
					collectionsProvider.export(collection, exportPath);
					vscode.window.showInformationMessage(MESSAGE.EXPORT_SUCCESSFUL);
				}
			});
		}
	);

	const disp_newFolderCmd = vscode.commands.registerCommand(
		COMMAND.NEW_FOLDER,
		async (folderLike: RequestCollection | RequestFolder) => {
			const folderName = await handleInputName();
			if (!folderName) {
				return;
			}

			const existingNames = collectionsProvider.getSubfolders(folderLike.id!).map(folder => folder.name);
			if (existingNames.includes(folderName.trim())) {
				await vscode.window.showInformationMessage(MESSAGE.FOLDER_EXISTS);
				return;
			}
			collectionsProvider.addFolderLike(folderName.trim(), folderLike);
		}
	);

	const disp_duplicateFolderCmd = vscode.commands.registerCommand(
		COMMAND.DUPLICATE_FOLDER,
		(folder: RequestFolder) => collectionsProvider.duplicate(folder)
	);

	const disp_renameFolderCmd = vscode.commands.registerCommand(
		COMMAND.RENAME_FOLDER,
		async (folder: RequestFolder) => {
			const newName = await handleInputName(folder.name);
			if (!newName) {
				return;
			}

			const existingNames = collectionsProvider.getSubfolders(folder.parent.id!).map(folder => folder.name);
			if (existingNames.includes(newName.trim())) {
				await vscode.window.showInformationMessage(MESSAGE.FOLDER_EXISTS);
				return;
			}
			collectionsProvider.renameFolderLike(folder, newName.trim());
		}
	);

	const disp_deleteFolderCmd = vscode.commands.registerCommand(
		COMMAND.DELETE_FOLDER,
		async (folder: RequestFolder) => {
			const action = await vscode.window.showWarningMessage(
				MESSAGE.DELETE_COLLECTION_REMINDER,
				MESSAGE.YES,
				MESSAGE.NO
			);
			if (action === MESSAGE.YES) {
				collectionsProvider.delete(folder);
			}
		}
	);

	const disp_newCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.NEW_COLLECTION_REQUEST,
		async (folderLike: RequestCollection | RequestFolder) => {
			const requestName = await handleInputName();
			if (!requestName) {
				return;
			}
			initializePanel({ parentId: folderLike.id, requestName: requestName.trim() });
		}
	);

	const disp_copyCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.COPY_COLLECTION_REQUEST,
		(requestItem: RequestItem) => {
			requestInClipboard = requestItem;
			vscode.window.showInformationMessage(MESSAGE.COPY_SUCCESFUL_MESSAGE);
		}
	);

	const disp_pasteCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.PASTE_COLLECTION_REQUEST,
		(folderLike: RequestCollection | RequestFolder) => {
			if (!requestInClipboard) {
				vscode.window.showInformationMessage(MESSAGE.NO_PASTABLE_REQUST);
				return;
			}

			const newRequest = {
				...requestInClipboard.request,
				id: crypto.randomUUID(),
				name: `${requestInClipboard.request.name} - Copy`,
			};
			collectionsProvider.addRequest(newRequest, folderLike.id!);
			requestInClipboard = null;
		}
	);

	const disp_duplicateCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.DUPLICATE_COLLECTION_REQUEST,
		(requestItem: RequestItem) => {
			const newRequest = {
				...requestItem.request,
				id: crypto.randomUUID(),
				name: `${requestItem.request.name} - Copy`
			};
			collectionsProvider.addRequest(newRequest, requestItem.parent.id!);
		}
	);

	const disp_clearCollectionItemsCmd = vscode.commands.registerCommand(
		COMMAND.CLEAR_COLLECTION_ITEMS,
		(folderLike: RequestCollection | RequestFolder) => {
			collectionsProvider.clearItems(folderLike);
		}
	);

	const disp_renameCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.RENAME_COLLECTION_REQUEST,
		async (requestItem: RequestItem) => {
			const newRequestName = await handleInputName(requestItem.request.name);
			if (!newRequestName) {
				return;
			}
			collectionsProvider.renameRequest(requestItem, newRequestName.trim());
		}
	);

	const disp_deleteCollectionRequestCmd = vscode.commands.registerCommand(
		COMMAND.DELETE_COLLECTION_REQUEST,
		(requestItem: RequestItem) => {
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

	const disp_importCurlCmd = vscode.commands.registerCommand(
		COMMAND.IMPORT_CURL,
		async () => {
			const inputCurl = await handleInput("CURL command");
			if (!inputCurl || !inputCurl.trim()) {
				return;
			}
			const request = parseCurl(inputCurl);

			initializePanel({});
			currentMainPanel?.webview.postMessage({ type: TYPE.TREEVIEW_DATA, ...request });
		}
	);

	const disp_onThemeChangeHandler = vscode.window.onDidChangeActiveColorTheme((e) => {
		if (currentMainPanel) {
			const workbenchConfig = vscode.workspace.getConfiguration("workbench");
			const themeName: string = workbenchConfig.get("colorTheme") || "";
			const tokenColors = getTokenColors(themeName);
			currentMainPanel.webview.postMessage({
				type: TYPE.THEME_CHANGED,
				tokenColors,
				themeKind: e.kind,
			});
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
				vscode.window.showErrorMessage(`Authorization failed: ${paramErrorDesc} [${paramErrorUri}]`);
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
	context.subscriptions.push(disp_copyCollectionCmd);
	context.subscriptions.push(disp_duplicateCollectionCmd);
	context.subscriptions.push(disp_renameCollectionCmd);
	context.subscriptions.push(disp_deleteCollectionCmd);
	context.subscriptions.push(disp_exportCollectionCmd);

	context.subscriptions.push(disp_newFolderCmd);
	context.subscriptions.push(disp_duplicateFolderCmd);
	context.subscriptions.push(disp_renameFolderCmd);
	context.subscriptions.push(disp_deleteFolderCmd);

	context.subscriptions.push(disp_newCollectionRequestCmd);
	context.subscriptions.push(disp_copyCollectionRequestCmd);
	context.subscriptions.push(disp_pasteCollectionRequestCmd);
	context.subscriptions.push(disp_duplicateCollectionRequestCmd);
	context.subscriptions.push(disp_clearCollectionItemsCmd);
	context.subscriptions.push(disp_renameCollectionRequestCmd);
	context.subscriptions.push(disp_deleteCollectionRequestCmd);

	context.subscriptions.push(disp_manageTokensCmd);
	context.subscriptions.push(disp_importCurlCmd);

	// Subscribe handlers
	context.subscriptions.push(disp_onThemeChangeHandler);
	context.subscriptions.push(disp_uriHandler);
}

export function deactivate() { }
