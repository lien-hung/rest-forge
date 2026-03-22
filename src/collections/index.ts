import fs from "fs";
import path from "path";
import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Uri } from "vscode";

import { RequestCollection, RequestFolder, RequestItem } from "./tree-items";
import { IRequestTreeItemState } from "../utils/type";
import { generateId, getHomePath, getMethodIcons } from "../utils";

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
    const treeRequests = this.tree.filter(item => item instanceof RequestItem);
    const newFolderLike = parent ? new RequestFolder(name, parent) : new RequestCollection(name);
    this.tree.splice(-treeRequests.length, 0, newFolderLike);

    this.refresh();
    this.save();
    return newFolderLike;
  }

  public addRequest(request: IRequestTreeItemState, parentId: string) {
    const existingRequest = this.tree.find(item => item.id === request.id && item.parent?.id === parentId) as RequestItem;
    if (existingRequest) {
      existingRequest.tooltip = `${request.method} ${request.url}\nCreated at ${new Date(request.timestamp).toLocaleString()}`;
      Object.assign(existingRequest.request, request);
    } else {
      const parent = this.tree.find(item => item.id === parentId) as RequestFolderLike;
      this.tree.push(new RequestItem(request, parent));
    }
    this.refresh();
    this.save();
  }

  public copy(source: RequestFolderLike, destination: RequestFolderLike) {
    const children = this.tree.filter(item => item.parent?.id === source.id);
    for (const child of children) {
      this.copyItem(child, destination);
    }
    this.refresh();
    this.save();
  }

  private copyItem(item: CollectionsProviderItem, newParent: RequestFolderLike): void {
    if (item instanceof RequestFolder) {
      const newFolder = this.addFolderLike(item.name, newParent);
      const children = this.tree.filter(i => i.parent?.id === item.id);
      for (const child of children) {
        this.copyItem(child, newFolder);
      }
    } else if (item instanceof RequestItem) {
      const newRequest = { ...item.request, id: generateId() };
      this.addRequest(newRequest, newParent.id!);
    }
  }

  public duplicate(folderLike: RequestFolderLike) {
    const parent = folderLike instanceof RequestFolder ? folderLike.parent : undefined;
    const newFolderLike = this.addFolderLike(`${folderLike.name} - Copy`, parent);
    this.copy(folderLike, newFolderLike);
  }

  public export(folderLike: RequestFolderLike, path: string) {
    const exportArray = [folderLike, ...this.getDescendants(folderLike)];
    const exportData = exportArray.map(item => item?.toFileData());
    fs.writeFileSync(path, JSON.stringify(exportData, null, 2));
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
    const itemsToDelete = this.getDescendants(folderLike);
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

  public getCollectionByName(name?: string): RequestCollection {
    return this.tree.find(item => item instanceof RequestCollection && item.name === name) as RequestCollection;
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

  private getDescendants(folderLike: RequestFolderLike) {
    const descendants = [];
    const queue: CollectionsProviderItem[] = [folderLike];

    while (queue.length) {
      const queueItem = queue.shift();
      if (queueItem?.id !== folderLike.id) {
        descendants.push(queueItem);
      }
      queue.push(...this.tree.filter(item => item.parent?.id === queueItem?.id));
    }

    return descendants;
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
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  constructor(context: ExtensionContext) {
    this.extensionContext = context;
    this.readFile();
  }
}