import fs from "fs";
import { EventEmitter, ThemeIcon, TreeDataProvider, TreeItem } from "vscode";

import { getHomePath } from "../utils";
import { IEnvironmentTreeItemState, IEnvironmentVariable } from "../utils/type";
import { EnvironmentTreeItem } from "./treeItems";
import { EnvironmentStatusEntry } from "./statusEntry";

export default class EnvironmentsProvider implements TreeDataProvider<EnvironmentTreeItem> {
  private _onDidChangeTreeData: EventEmitter<EnvironmentTreeItem | undefined> = new EventEmitter();
  public readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private static readonly _onDidChangeEnvironment = new EventEmitter<string>();
  public static readonly onDidChangeEnvironment = this._onDidChangeEnvironment.event;
  private tree: EnvironmentTreeItem[] = [];
  private statusItem: EnvironmentStatusEntry;

  public getTreeItem(element: EnvironmentTreeItem): TreeItem | Thenable<TreeItem> {
    element.iconPath = new ThemeIcon("arrow-swap");
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
    this.tree.push(newItem);
    this.refresh();
    this.save();
  }

  public update(item: EnvironmentTreeItem, newVariables: IEnvironmentVariable[]) {
    item.data.variables = newVariables;
    this.refresh();
    this.save();
  }

  public delete(item: EnvironmentTreeItem) {
    if (item.data.isActive) {
      this.statusItem.update();
    }
    this.tree = this.tree.filter(i => i.data.name !== item.data.name);
    this.refresh();
    this.save();
  }

  public renameEnv(item: EnvironmentTreeItem, newName: string) {
    item.label = newName;
    item.data.name = newName;
    if (item.data.isActive) {
      this.statusItem.update(newName);
    }
    this.refresh();
    this.save();
  }

  public getByName(name: string) {
    return this.tree.find(item => item.data.name === name);
  }

  public setActiveEnv(name: string) {
    const envItem = this.tree.find(item => item.data.name === name);
    if (envItem) {
      this.tree.forEach(item => {
        item.data.isActive = item.data.name === name;
        item.description = item.data.name === name ? "Active" : "";
      });
      this.statusItem.update(name);
    }
    this.refresh();
    this.save();
  }

  public setNoActiveEnv() {
    this.tree.forEach(item => {
      item.data.isActive = false;
      item.description = "";
    });
    this.statusItem.update();
    this.refresh();
    this.save();
  }

  public exportEnv(item: EnvironmentTreeItem, path: string) {
    const envLines = item.data.variables
      .filter((v) => v.key && v.isChecked)
      .map((v) => `${v.key}=${v.value}`);
    const envString = envLines.join("\n");
    fs.writeFileSync(path, envString);
  }

  private get filePath() {
    return getHomePath("environments.json");
  }

  public get envNames() {
    return this.tree.map(item => item.data.name);
  }

  public get activeEnv() {
    const activeEnvItem = this.tree.find(item => item.data.isActive);
    return activeEnvItem?.data.name;
  }

  public get activeVariables() {
    const activeEnvItem = this.tree.find(item => item.data.isActive);
    if (!activeEnvItem) {
      return {};
    }
    const variableObject = activeEnvItem.data.variables.reduce(
      (prev, variable) => variable.isChecked ? { ...prev, [variable.key]: variable.value } : prev, {}
    );
    return variableObject;
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

  constructor() {
    this.readFile();
    this.statusItem = new EnvironmentStatusEntry(this.activeEnv);
  }
}