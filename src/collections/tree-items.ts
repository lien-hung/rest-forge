import { TreeItem, TreeItemCollapsibleState } from "vscode";

import { COLLECTION, COMMAND } from "../constants";
import { IRequestTreeItemState } from "../utils/type";
import { generateId, getElapsedTime } from "../utils";

export class RequestItem extends TreeItem {
  public contextValue = `${COLLECTION.REQUEST_COLLECTION}.item`;

  constructor(public request: IRequestTreeItemState, public parent: RequestCollection | RequestFolder) {
    super(request.name, TreeItemCollapsibleState.None);
    this.id = request.id;
    this.parent = parent;
    this.description = getElapsedTime(request.requestedTime);
    this.tooltip = `${request.method} ${request.url}\nCreated at ${new Date(request.requestedTime).toLocaleString()}`;
    this.command = {
      title: "Open Request",
      command: COMMAND.OPEN_REQUEST,
      arguments: [this]
    };
  }

  public toFileData() {
    return {
      parentId: this.parent.id,
      request: this.request,
    };
  }
}

export class RequestFolder extends TreeItem {
  public contextValue = `${COLLECTION.REQUEST_COLLECTION}.folder`;

  constructor(public name: string, public parent: RequestCollection | RequestFolder, id?: string) {
    super(name, TreeItemCollapsibleState.Collapsed);
    this.parent = parent;
    this.id = id || generateId();
  }

  public toFileData() {
    return {
      id: this.id,
      name: this.name,
      isFolder: true,
      parentId: this.parent.id,
    };
  }
}

export class RequestCollection extends TreeItem {
  public contextValue = `${COLLECTION.REQUEST_COLLECTION}.collection`;
  public parent = null;

  constructor(public name: string, id?: string) {
    super(name, TreeItemCollapsibleState.Expanded);
    this.id = id || generateId();
  }

  public toFileData() {
    return {
      id: this.id,
      name: this.name,
      isCollection: true,
    };
  }
}