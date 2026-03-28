export type RequestItemEntry = {
  request: IRequestTreeItemState;
};

export type RequestFolderEntry = {
  folder: string;
  data: CollectionDataEntry[];
};

export type RequestCollectionEntry = {
  collection: string;
  data: CollectionDataEntry[];
};

export type CollectionDataEntry = RequestFolderEntry | RequestItemEntry;