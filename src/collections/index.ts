import fs from "fs";
import path from "path";
import { EventEmitter, ExtensionContext, TreeDataProvider, Uri } from "vscode";

import { RequestCollection, RequestCollectionItem } from "./tree-items";
import { IRequestTreeItemState } from "../utils/type";
import { getHomePath, getMethodIcons } from "../utils";

type CollectionsProviderItem = RequestCollectionItem | RequestCollection;

export default class CollectionsProvider implements TreeDataProvider<CollectionsProviderItem> {
  private extensionContext: ExtensionContext;
  private _onDidChangeTreeData: EventEmitter<CollectionsProviderItem | undefined> = new EventEmitter();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private tree: { [collection: string]: RequestCollection } = {};

  public getTreeItem(element: CollectionsProviderItem): CollectionsProviderItem {
    if (element instanceof RequestCollectionItem) {
      element.iconPath = getMethodIcons(this.extensionContext, element.request.method);
    } else if (element instanceof RequestCollection) {
      element.iconPath = Uri.file(this.extensionContext.asAbsolutePath(path.join("icons/svg", "collection.svg")));
    }
    return element;
  }

  public getChildren(element?: CollectionsProviderItem): CollectionsProviderItem[] {
    if (!element) {
      return Object.keys(this.tree).map(collection => this.tree[collection]);
    } else if (element instanceof RequestCollection) {
      return element.items;
    }
    return [];
  }

  public getParent(element: CollectionsProviderItem) {
    return element.parent || null;
  }

  public refresh(item?: CollectionsProviderItem) {
    this._onDidChangeTreeData.fire(item);
  }

  public add(collection: string, request?: IRequestTreeItemState, skipSave?: boolean) {
    if (!this.tree[collection]) {
      this.tree[collection] = new RequestCollection(collection);
    }
    if (request) {
      this.tree[collection].addItem(request);
    }
    this.refresh();
    if (!skipSave) {
      this.save();
    }
  }

  public delete(item: CollectionsProviderItem) {
    if (item instanceof RequestCollection) {
      delete this.tree[item.name];
    } else if (item instanceof RequestCollectionItem) {
      const collection = item.parent.name;
      this.tree[collection].deleteItem(item.id!);
    }
    this.refresh();
    this.save();
  }

  public clearItems(collection: string) {
    if (this.tree[collection]) {
      this.tree[collection].clearItems();
    }
    this.refresh();
    this.save();
  }

  public renameCollection(oldName: string, newName: string) {
    this.tree[newName] = new RequestCollection(newName);
    this.tree[newName].items = Array.from(this.tree[oldName].items);
    delete this.tree[oldName];

    this.refresh();
    this.save();
  }

  public renameItem(collection: string, id: string, newName: string) {
    this.tree[collection].renameItem(id, newName);
    this.refresh();
    this.save();
  }

  public isCollectionExist(collection: string) {
    return Object.keys(this.tree).findIndex(name => collection === name) !== -1;
  }

  public clear() {
    this.tree = {};
    this.refresh();
    this.save();
  }

  private get filePath() {
    return getHomePath("collections.json");
  }

  public get collectionNames() {
    return Object.keys(this.tree);
  }

  private readFile() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, "{}");
      }
      const dataStr = fs.readFileSync(this.filePath, { encoding: "utf8" });
      const data = JSON.parse(dataStr);
      Object.keys(data).forEach((collection) => {
        const requests = data[collection];
        if (requests.length === 0) {
          this.add(collection, undefined, true);
          return;
        }
        requests.forEach((request: IRequestTreeItemState) => {
          this.add(collection, request, true);
        });
      });
    } catch (error) {
      console.error("Error loading collections: ", error);
    }
  }

  private save() {
    const data = Object.values(this.tree).reduce((collection, item) => ({ ...collection, ...item.toJSON() }), {});
    fs.writeFileSync(this.filePath, JSON.stringify(data));
  }

  constructor(context: ExtensionContext) {
    this.extensionContext = context;
    this.readFile();
  }
}