export interface FolderDetailsProps {
  folderDetailData: Folder[];
  setCreateNewItem: (
    itemType: CreateNewItemType,
    itemName: string,
    dataItem: string
  ) => void;
  parent: { parentId: string; parentName: string };
  setParent: (parentId: string, parentName: string) => void;
  moveItem: ClipboardItemType;
  setMoveItem: (item: ClipboardItemType) => void;
  setTriggerReload: () => void; //this use to notify useSWR to mutate
  currentSortType: TableSortType;
  setCurrentSortType: (currentSortType: TableSortType) => void;
}

export interface CreateNewFileFormProps {
  setVisible: (visible: boolean) => void;
  submitItem: (itemName: string, dataItem: string) => void;
  itemType: CreateNewItemType;
}

export interface ShowTextFileProps {
  setVisible: (visible: boolean) => void;
  fileName: string;
  data: string;
  submitItem: (itemName: string, dataItem: string) => void;
}

export interface Folder {
  id: string;
  parent_id: string;
  name: string;
  type: string;
  data: string;
  created_at: string;
}

export enum CreateNewItemType {
  EMPTY, //use to hide createItemForm
  FOLDER = "folder",
  FILE = "file",
}

export interface PathAddress {
  id: string;
  name: string;
}

export interface ClipboardItemType {
  id: string;
  name: string;
  parentId?: number | string;
  type?: string;
}

export enum TableSortType {
  NAME_ASC = "NAME_ASC",
  NAME_DESC = "NAME_DESC",
  CREATED_AT_ASC = "CREATED_AT_ASC",
  CREATED_AT_DESC = "CREATED_AT_DESC",
}
