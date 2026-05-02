import { IRequestObject } from "../utils/type";

export type RequestItemEntry = {
  request: {
    id: string;
    name: string;
    timestamp: number;
    requestObject: Partial<IRequestObject>;
  };
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