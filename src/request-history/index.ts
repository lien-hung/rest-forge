import fs from "fs";
import { EventEmitter, ExtensionContext, TreeDataProvider } from "vscode";

import { getHomePath, getMethodIcons } from "../../src/utils";
import { IRequestTreeItemState } from "../utils/type";
import { RequestHistoryTreeItem } from "./tree-items";

export default class RequestHistoryProvider implements TreeDataProvider<RequestHistoryTreeItem> {
  private extensionContext: ExtensionContext;
  private _onDidChangeTreeData: EventEmitter<RequestHistoryTreeItem | undefined> = new EventEmitter();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private tree: RequestHistoryTreeItem[] = [];

  public getTreeItem(element: RequestHistoryTreeItem): RequestHistoryTreeItem {
    element.iconPath = getMethodIcons(this.extensionContext, element.request.method);
    return element;
  }

  public getChildren(): RequestHistoryTreeItem[] {
    return this.tree;
  }

  public getItemById(id: string) {
    return this.tree.find(item => item.id === id);
  }

  public refresh(item?: RequestHistoryTreeItem) {
    this._onDidChangeTreeData.fire(item);
  }

  public add(state: IRequestTreeItemState) {
    const treeItem = new RequestHistoryTreeItem(state);
    this.tree.unshift(treeItem);
    this.refresh();
    this.save();
  }

  public delete(item: RequestHistoryTreeItem) {
    this.tree = this.tree.filter(i => i.id !== item.id);
    this.refresh();
    this.save();
  }

  public clear() {
    this.tree = [];
    this.refresh();
    this.save();
  }

  private get filePath() {
    return getHomePath("request-history.json");
  }

  private readFile() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, "[]");
      }
      const dataStr = fs.readFileSync(this.filePath, { encoding: "utf8" });
      const data = JSON.parse(dataStr) as IRequestTreeItemState[];
      this.tree = data.map((state) => new RequestHistoryTreeItem(state));
    } catch (error) {
      console.error("Error loading request history: ", error);
    }
  }

  private save() {
    const data = this.tree.map((item) => item.request);
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }
  
  constructor(context: ExtensionContext) {
    this.extensionContext = context;
    this.readFile();
  }
}