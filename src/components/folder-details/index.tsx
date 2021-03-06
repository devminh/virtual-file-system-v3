import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonMenu,
  Dialog,
  Menu,
  MenuItemProps,
  Table,
  TableColumn,
  toast,
} from "@moai/core";
import {
  CreateNewItemType,
  FolderDetailsProps,
  Folder,
  TableSortType,
} from "./interface";
import useMousePosition from "./use-mouse-position";

import {
  AiOutlineFile,
  AiOutlineFolder,
  AiOutlineSortAscending,
  AiOutlineSortDescending,
} from "react-icons/ai";
import CreateNewItemForm from "./create-new-item-form";
import ShowTextFile from "./show-text-file";
import {
  BsSortNumericDown,
  BsSortNumericUpAlt,
  BsThreeDots,
} from "react-icons/bs";
import axios from "axios";
import { API_URL_FILE_STORAGE } from "../../constants/endpoint";
import { NAME_REGEX } from "../../constants";

const FolderDetails = ({
  folderDetailData,
  parent,
  setParent,
  moveItem,
  setMoveItem,
  setCreateNewItem,
  setTriggerReload,
  currentSortType,
  setCurrentSortType,
}: FolderDetailsProps): JSX.Element => {
  const [isShowContextMenu, setIsShowContextMenu] = useState<boolean>(false);
  const [currentMousePosition, setCurrentMousePosition] = useState<number>(0);
  const { clientX } = useMousePosition();

  const [createNewItemType, setCreateNewItemType] = useState<CreateNewItemType>(
    CreateNewItemType.EMPTY
  );

  const [menuAction, setMenuAction] = useState([
    {
      label: "Create new file",
      fn: () => setCreateNewItemType(CreateNewItemType.FILE),
    },
    {
      label: "Create new folder",
      fn: () => setCreateNewItemType(CreateNewItemType.FOLDER),
    },
  ]);

  const [fileShowing, setFileShowing] = useState<{
    fileId: string;
    fileName: string;
    data: string;
  }>({ fileId: "", fileName: "", data: "" });

  const handlePasteItem = () => {
    if (folderDetailData.find((item) => item.name === moveItem.name)) {
      toast(
        toast.types.failure,
        `This name has appeared in this "${parent.parentName}" folder`
      );
    } else {
      axios
        .put(API_URL_FILE_STORAGE, {
          id: Number(moveItem.id),
          parent_id: parent.parentId,
        })
        .then((res) => {
          if (res.data.statusCode === 200) {
            setTriggerReload();
            setMoveItem({ id: "", name: "", parentId: "" });
            toast(toast.types.success, `Paste item successfully`);
          }
        });
    }
  };

  useEffect(() => {
    if (moveItem.parentId !== parent.parentId) {
      if (!menuAction.find((item) => item.label === "Paste")) {
        setMenuAction([
          ...menuAction,
          {
            label: "Paste",
            fn: () => handlePasteItem(),
          },
        ]);
      }
    } else {
      setMenuAction(menuAction.filter((item) => item.label !== "Paste"));
    }
  }, [moveItem, parent, menuAction]);

  const handleUpdated = (
    id: string,
    name: string,
    type: string,
    data: string = ""
  ) => {
    if (type === "file") {
      name += ".txt";
    }
    axios
      .put(API_URL_FILE_STORAGE, {
        id: Number(id),
        name: name,
        data: data,
      })
      .then((res) => {
        if (res.data.statusCode === 200) {
          setTriggerReload();
          toast(toast.types.success, `Update item successfully`);
        }
      });
  };

  const columns: TableColumn<Folder>[] = useMemo(
    () => [
      {
        title: "Name",
        className: "text-center whitespace-nowrap",
        render: (r) => (
          <div
            className="flex items-center text-blue-600 cursor-pointer"
            onClick={() => {
              if (r.type === "file") {
                setFileShowing({
                  fileId: r.id,
                  fileName: r.name,
                  data: r.data || "",
                });
              }
              if (r.type === "folder") {
                setParent(r.id, r.name);
              }
            }}
          >
            {r.type === "file" ? <AiOutlineFile /> : <AiOutlineFolder />}
            {r.name}
          </div>
        ),
      },
      {
        title: "Created At",
        className: "text-center whitespace-nowrap",
        render: "created_at",
      },
      {
        title: "Action",
        className: "whitespace-nowrap",
        render: (r) => {
          const actions: MenuItemProps[] = [
            {
              label: "Rename",
              fn: async () => {
                const tempFolderDetail = folderDetailData.filter(
                  (item) => item.id !== r.id
                );
                const name = (await Dialog.prompt("Rename")) || "";

                if (NAME_REGEX.test(name)) {
                  if (tempFolderDetail.find((item) => item.name === name)) {
                    toast(
                      toast.types.failure,
                      `This name has appeared in this "${parent.parentName}" folder`
                    );
                  } else {
                    handleUpdated(r.id, name, r.type);
                  }
                } else {
                  toast(
                    toast.types.failure,
                    "Invalid name format. Please try again"
                  );
                }
              },
            },
            {
              label: "Move",
              fn: () => {
                Dialog.confirm(
                  `Are you sure you want to move this ${r.type}?`
                ).then((confirm: boolean) => {
                  setMoveItem({
                    id: r.id,
                    name: r.name,
                    parentId: parent.parentId,
                    type: r.type,
                  });
                });
              },
            },
            {
              label: "Delete",
              fn: () => {
                Dialog.confirm(
                  `Are you sure you want to delete this ${r.type}?`
                ).then((confirm: boolean) => {
                  if (confirm) {
                    axios
                      .delete(`${API_URL_FILE_STORAGE}/${r.id}`)
                      .then((res) => {
                        if (res.data) {
                          setTriggerReload();
                          toast(
                            toast.types.success,
                            `Delete ${r.type} successfully`
                          );
                        }
                      });
                  }
                });
              },
            },
          ];

          return (
            <ButtonMenu
              items={actions}
              placement="bottom"
              button={{
                fill: true,
                style: Button.styles.flat,
                children: <BsThreeDots />,
              }}
            />
          );
        },
      },
    ],
    [parent]
  );

  return (
    <div
      className="relative p-4 border border-gray-300"
      onContextMenu={(e) => {
        e.preventDefault();
        setIsShowContextMenu(true);
        setCurrentMousePosition(clientX);
      }}
      onClick={() => setIsShowContextMenu(false)}
    >
      <div className="flex flex-wrap items-center space-x-4 space-y-2">
        <div className="font-bold">Order by</div>
        <div
          className={`flex cursor-pointer items-center p-2 space-x-2 border-2 ${
            currentSortType === TableSortType.NAME_ASC
              ? "border-blue-500"
              : "border-gray-400"
          }`}
          onClick={() => setCurrentSortType(TableSortType.NAME_ASC)}
        >
          <AiOutlineSortAscending size={30} />
          <div>Name</div>
        </div>

        <div
          className={`flex cursor-pointer items-center p-2 space-x-2 border-2 ${
            currentSortType === TableSortType.NAME_DESC
              ? "border-blue-500"
              : "border-gray-400"
          }`}
          onClick={() => setCurrentSortType(TableSortType.NAME_DESC)}
        >
          <AiOutlineSortDescending size={30} />
          <div>Name</div>
        </div>

        <div
          className={`flex cursor-pointer items-center p-2 space-x-2 border-2 ${
            currentSortType === TableSortType.CREATED_AT_ASC
              ? "border-blue-500"
              : "border-gray-500"
          }`}
          onClick={() => setCurrentSortType(TableSortType.CREATED_AT_ASC)}
        >
          <BsSortNumericUpAlt size={30} />
          <div>Created At</div>
        </div>

        <div
          className={`flex cursor-pointer items-center p-2 space-x-2 border-2 ${
            currentSortType === TableSortType.CREATED_AT_DESC
              ? "border-blue-400"
              : "border-gray-400"
          }`}
          onClick={() => setCurrentSortType(TableSortType.CREATED_AT_DESC)}
        >
          <BsSortNumericDown size={30} />
          <div>Created At</div>
        </div>
      </div>

      <div className="p-4 overflow-auto">
        <Table
          fill
          columns={columns}
          rows={folderDetailData || []}
          rowKey={(r: any) => r.id}
        />
      </div>
      {isShowContextMenu && (
        <div
          style={{
            maxWidth: "300px",
            position: "absolute",
            left: currentMousePosition,
            top: "70%",
          }}
        >
          <Menu items={menuAction} />
        </div>
      )}
      {createNewItemType !== CreateNewItemType.EMPTY && (
        <CreateNewItemForm
          setVisible={(visible) => {
            if (!visible) {
              setCreateNewItemType(CreateNewItemType.EMPTY);
            }
          }}
          submitItem={(itemName, dataItem) => {
            //check if exist
            if (createNewItemType === CreateNewItemType.FILE) {
              itemName += ".txt";
            }
            if (folderDetailData.find((item) => item.name === itemName)) {
              toast(
                toast.types.failure,
                `This name has appeared in this "${parent.parentName}" folder`
              );
            } else {
              setCreateNewItem(createNewItemType, itemName, dataItem);
              setCreateNewItemType(CreateNewItemType.EMPTY);
            }
          }}
          itemType={createNewItemType}
        />
      )}
      {fileShowing.fileName && (
        <ShowTextFile
          fileName={fileShowing.fileName}
          data={fileShowing.data}
          setVisible={(visible) => {
            if (!visible) {
              setFileShowing({ fileId: "", fileName: "", data: "" });
            }
          }}
          submitItem={(itemName, dataItem) => {
            //check if exist
            if (folderDetailData.find((item) => item.name === itemName)) {
              toast(
                toast.types.failure,
                `This name has appeared in this "${parent.parentName}" folder`
              );
            } else {
              handleUpdated(fileShowing.fileId, itemName, "file", dataItem);
              setTimeout(() => {
                setFileShowing({ fileId: "", fileName: "", data: "" });
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default FolderDetails;
