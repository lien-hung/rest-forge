import fs from "fs";
import { EventEmitter, ExtensionContext, TreeDataProvider, TreeItem, Uri } from "vscode";
import path from "path";

import { getHomePath } from "../utils";
import { IEnvironmentTreeItemState } from "../utils/type";
import { EnvironmentTreeItem } from "./tree-items";

export default class EnvironmentsProvider implements TreeDataProvider<EnvironmentTreeItem> {
  private extensionContext: ExtensionContext;
  private _onDidChangeTreeData: EventEmitter<EnvironmentTreeItem | undefined> = new EventEmitter();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private tree: EnvironmentTreeItem[] = [];

  public getTreeItem(element: EnvironmentTreeItem): TreeItem | Thenable<TreeItem> {
    element.iconPath = {
      light: Uri.file(this.extensionContext.asAbsolutePath(path.join("icons/svg", "env-light.svg"))),
      dark: Uri.file(this.extensionContext.asAbsolutePath(path.join("icons/svg", "env-dark.svg")))
    };
    return element;
  }

  public getChildren(): EnvironmentTreeItem[] {
    return this.tree;
  }

  public refresh(item?: EnvironmentTreeItem) {
    this._onDidChangeTreeData.fire(item);
  }

  public add(state: IEnvironmentTreeItemState) {
    const newItem = new EnvironmentTreeItem(state);
    const existingIndex = this.tree.findIndex(item => item.data.name === state.name);
    if (existingIndex !== -1) {
      this.tree.splice(existingIndex, 1, newItem);
    } else {
      this.tree.push(newItem);
    }
    this.refresh();
    this.save();
  }

  public delete(item: EnvironmentTreeItem) {
    this.tree = this.tree.filter(i => i.data.name !== item.data.name);
    this.refresh();
    this.save();
  }

  public renameEnv(envItem: EnvironmentTreeItem, newName: string) {
    envItem.label = newName;
    envItem.data.name = newName;
    this.refresh();
    this.save();
  }

  public getByName(name: string) {
    return this.tree.find(item => item.data.name === name);
  }

  private get filePath() {
    return getHomePath("environments.json");
  }

  public get envNames() {
    return this.tree.map(item => item.data.name);
  }

  private readFile() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, "[]");
      }
      const dataStr = fs.readFileSync(this.filePath, { encoding: "utf8" });
      const data = JSON.parse(dataStr) as IEnvironmentTreeItemState[];
      this.tree = data.map((state) => new EnvironmentTreeItem(state));
    } catch (error) {
      console.error("Error loading environments: ", error);
    }
  }

  private save() {
    const data = this.tree.map((item) => item.data);
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  constructor(context: ExtensionContext) {
    this.extensionContext = context;
    this.readFile();
  }
}