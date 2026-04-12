import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { COLLECTION, COMMAND } from "../constants";
import { IEnvironmentTreeItemState } from "../utils/type";

export class EnvironmentTreeItem extends TreeItem {
  public parent = null;
  public contextValue = `${COLLECTION.ENVIRONMENTS}.item`;
  
  constructor(public data: IEnvironmentTreeItemState) {
    super(data.name, TreeItemCollapsibleState.None);
    this.command = {
      title: "Open Environment",
      command: COMMAND.OPEN_ENVIRONMENT,
      arguments: [this]
    };
  }
}