import fs from "fs";
import path from "path";
import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Uri } from "vscode";

import { RequestCollection, RequestFolder, RequestItem } from "./tree-items";
import { IRequestTreeItemState } from "../utils/type";
import { getHomePath, getMethodIcons } from "../utils";

type CollectionsProviderItem = RequestCollection | RequestFolder | RequestItem;
type RequestFolderLike = RequestCollection | RequestFolder;

export default class CollectionsProvider implements TreeDataProvider<CollectionsProviderItem> {
  private extensionContext: ExtensionContext;
  private _onDidChangeTreeData: EventEmitter<CollectionsProviderItem | undefined> = new EventEmitter();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private tree: CollectionsProviderItem[] = [];

  public getTreeItem(element: CollectionsProviderItem): TreeItem {
    if (element instanceof RequestCollection) {
      element.iconPath = Uri.file(this.extensionContext.asAbsolutePath(path.join("icons/svg", "collection.svg")));
    } else if (element instanceof RequestFolder) {
      element.iconPath = Uri.file(this.extensionContext.asAbsolutePath(path.join("icons/svg", "folder.svg")));
    } else if (element instanceof RequestItem) {
      element.iconPath = getMethodIcons(this.extensionContext, element.request.method);
    }
    return element;
  }

  public getChildren(element?: CollectionsProviderItem): CollectionsProviderItem[] {
    if (!element) {
      return this.tree.filter(item => item instanceof RequestCollection);
    } else {
      return this.tree.filter(item => item.parent && item.parent.id === element.id);
    }
  }

  public refresh(item?: CollectionsProviderItem) {
    this._onDidChangeTreeData.fire(item);
  }

  public addFolderLike(name: string, parent?: RequestFolderLike) {
    if (!parent) {
      this.tree.push(new RequestCollection(name));
    } else {
      this.tree.push(new RequestFolder(name, parent));
    }
    this.refresh();
    this.save();
  }

  public addRequest(request: IRequestTreeItemState, parentId: string) {
    const existingRequest = this.tree.find(item => item.id === request.id && item.parent?.id === parentId) as RequestItem;
    if (existingRequest) {
      Object.assign(existingRequest.request, request);
    } else {
      const parent = this.tree.find(item => item.id === parentId) as RequestFolderLike;
      this.tree.push(new RequestItem(request, parent));
    }
    this.refresh();
    this.save();
  }

  public delete(toDelete: CollectionsProviderItem, skipSave?: boolean) {
    const children = this.tree.filter(item => item.parent?.id === toDelete.id);
    for (const child of children) {
      this.delete(child, true);
    }
    this.tree = this.tree.filter(item => item.id !== toDelete.id);
    if (!skipSave) {
      this.refresh();
      this.save();
    }
  }

  public clearItems(folderLike: RequestFolderLike) {
    const itemsToDelete = [];
    const queue: CollectionsProviderItem[] = [folderLike];

    while (queue.length) {
      const queueItem = queue.shift();
      if (queueItem?.id !== folderLike.id) {
        itemsToDelete.push(queueItem);
      }
      queue.push(...this.tree.filter(item => item.parent?.id === queueItem?.id));
    }

    itemsToDelete.forEach(toDelete => {
      this.tree = this.tree.filter(item => item.id !== toDelete?.id);
    });

    this.refresh();
    this.save();
  }

  public renameFolderLike(folderLike: RequestFolderLike, newName: string) {
    Object.assign(folderLike, { label: newName, name: newName });
    this.refresh();
    this.save();
  }

  public renameRequest(requestItem: RequestItem, newName: string) {
    Object.assign(requestItem, { label: newName });
    Object.assign(requestItem.request, { name: newName });
    this.refresh();
    this.save();
  }

  public isFolderLikeExist(name: string, parentId: string) {
    const parentArray = this.tree.filter(item => item.parent?.id === parentId);
    return parentArray.findIndex(item => !(item instanceof RequestItem) && item.name === name) !== -1;
  }

  public getCollectionByName(name?: string) {
    return this.tree.find(item => item instanceof RequestCollection && item.name === name);
  }

  public getCollectionFolders(id: string): RequestFolder[] {
    return this.tree.filter(item => item instanceof RequestFolder && item.parent.id === id) as RequestFolder[];
  }

  public getCollectionRequests(id: string): RequestItem[] {
    return this.tree.filter(item => item instanceof RequestItem && item.parent.id === id) as RequestItem[];
  }

  private get filePath() {
    return getHomePath("collections.json");
  }

  public get collectionNames() {
    return this.tree.filter(item => item instanceof RequestCollection).map(item => item.name);
  }

  private readFile() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, "[]");
      }
      const dataStr = fs.readFileSync(this.filePath, { encoding: "utf8" });
      const data = JSON.parse(dataStr);

      for (const item of data) {
        if (item.isCollection) {
          this.tree.push(new RequestCollection(item.name, item.id));
        } else if (item.isFolder) {
          const parent = this.tree.find(i => i.id === item.parentId) as RequestFolderLike;
          this.tree.push(new RequestFolder(item.name, parent, item.id));
        } else {
          const parent = this.tree.find(i => i.id === item.parentId) as RequestFolderLike;
          this.tree.push(new RequestItem(item.request, parent));
        }
      }
    } catch (error) {
      console.error("Error loading collection data:", error);
    }
  }

  private save() {
    const data = this.tree.map(item => item.toFileData());
    fs.writeFileSync(this.filePath, JSON.stringify(data));
  }

  constructor(context: ExtensionContext) {
    this.extensionContext = context;
    this.readFile();
  }
}