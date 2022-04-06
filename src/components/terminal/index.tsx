import { Input, toast } from "@moai/core";
import axios from "axios";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { API_URL_FILE_STORAGE } from "../../constants/endpoint";
import { fetcherSWR, removeRangeString } from "../../utils";
import { Folder, PathAddress } from "../folder-details/interface";
import { FolderLs, PathType, TerminalPageProps } from "./interface";
import { getValidCurrentFolderPath, getValidFolderPath } from "./utils";

const Terminal = ({ rootFolder }: TerminalPageProps): JSX.Element => {
  const [value, setValue] = useState<string>("");
  const [command, setCommand] = useState<string[]>([]);
  const [commandHistoryIndex, setCommandHistoryIndex] = useState<number>(0);

  const [commandResult, setCommandResult] = useState<string[]>([]);

  const [currentPath, setCurrentPath] = useState<PathAddress[]>([rootFolder]);

  const [currentParent, setCurrentParent] = useState<{
    id: string;
    name: string;
  }>(rootFolder);

  const { data: childItems = [], mutate } = useSWR<Folder[]>(
    `${API_URL_FILE_STORAGE}/?parent_id=${currentParent.id}`,
    fetcherSWR
  );

  // console.log("currentPath", currentPath);

  //whenever cd a folder, install all children locally.
  useEffect(() => {
    if (currentParent.id) {
      mutate();
    }
  }, [currentParent]);

  useEffect(() => {
    if (command.length) {
      setCommandHistoryIndex(command.length - 1);
    }
  }, [command]);

  const handleCommands = (val: string) => {
    setValue("");

    let dataParam = "";

    if (val.includes("[") && val.includes("]")) {
      //handle data param
      dataParam = val.slice(val.indexOf("["), val.indexOf("]") + 1);
      val = removeRangeString(
        val,
        val.indexOf("["),
        val.indexOf("]") + 1
      ).trim();
    }

    const commandParams = val ? val.replace(/\s+/g, " ").split(" ") : val;
    if (dataParam && Array.isArray(commandParams)) {
      commandParams.push(dataParam);
    }

    switch (commandParams[0]) {
      //handle ../ to get to parent folder

      case "cd":
        //path folder, find each folder if they exist name,parentId === previousOne
        if (commandParams.length <= 2) {
          switch (commandParams[1]) {
            case "..":
              if (currentPath.length > 1) {
                setCurrentParent({
                  id: currentPath[currentPath.length - 2].id,
                  name: currentPath[currentPath.length - 2].name,
                });
                setCurrentPath(currentPath.slice(0, currentPath.length - 1));
              }
              break;
            case "/":
              setCurrentParent({
                id: currentPath[0].id,
                name: currentPath[0].name,
              });
              setCurrentPath(currentPath.slice(0, 1));
              break;
            case ".":
              break;
            case "":
              break;
            case undefined:
              break;
            default:
              let parentId = currentParent.id;
              let tempCommand = commandParams[1];

              //detect parent path as ../../
              let parentPath = commandParams[1].match(/(\.\.\/)/g);

              let j = currentPath.length - 1;
              if (parentPath?.length) {
                tempCommand = tempCommand.replace(parentPath.join(""), "");

                for (let i = 0; i < parentPath?.length; i++) {
                  j--;
                }

                parentId = currentPath[j].id;
              }
              //detect parent path as ../../

              getValidCurrentFolderPath(
                parentId,
                tempCommand,
                PathType.FOLDER_PATH
              ).then((res) => {
                if (res.length) {
                  setCurrentPath([...currentPath, ...res]);

                  setCurrentParent({
                    id: res[res.length - 1].id,
                    name: res[res.length - 1].name,
                  });
                } else {
                  setCommandResult([
                    ...commandResult,
                    `Wrong path. Please try again`,
                  ]);
                }
              });

              break;
          }
        } else {
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
        }
        break;

      case "cr":
        if (commandParams.length <= 4) {
        } else {
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
        }
        break;

      case "cat":
        //if last item exist, check whether it is a file or not
        let parentId = currentParent.id;
        let tempCommand = commandParams[1];

        //detect parent path as ../../
        let parentPath = commandParams[1].match(/(\.\.\/)/g);

        if (parentPath?.length) {
          tempCommand = tempCommand.replace(parentPath.join(""), "");

          let j = currentPath.length - 1;
          for (let i = 0; i < parentPath?.length; i++) {
            j--;
          }

          parentId = currentPath[j].id;
        }
        //detect parent path as ../../

        if (commandParams.length <= 2 && commandParams[1]) {
          getValidFolderPath(parentId, tempCommand, PathType.FILE_PATH).then(
            (res) => {
              if (res.id && res.name && res.type === "file") {
                setCommandResult([...commandResult, res.data || ""]);
              } else {
                setCommandResult([
                  ...commandResult,
                  `Wrong path. Please try again`,
                ]);
              }
            }
          );
        } else {
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
        }
        break;

      case "ls":
        const header = ["name", "created_at", "size"].join(" | ");

        const tempChildItems: FolderLs[] = [];

        childItems.forEach(async (rows) => {
          let size: any = rows.data.length;
          if (rows.type === "folder") {
            const res = await axios.get(
              `${API_URL_FILE_STORAGE}/count-item/${rows.id}`
            );
            size = res.data.count;
          }
          tempChildItems.push({
            name: rows.name,
            created_at: rows.created_at,
            size: Number(size),
          });
        });

        setTimeout(() => {
          const content = tempChildItems
            .map((rows) => {
              return [rows.name, rows.created_at, rows.size].join(" | ");
            })
            .join("\n");

          setCommandResult([...commandResult, `${header}\n${content}`]);
        }, 500);

        break;

      case "find":
        if (commandParams.length <= 3) {
          if (commandParams[2]) {
            //find based folder path
          } else {
            const header = ["name", "created_at", "size"].join(" | ");
            const tempChildItem = childItems.filter((item) =>
              item.name.includes(commandParams[1])
            );
            const content = tempChildItem
              .map((rows: any): string =>
                [rows.name, rows.created_at, rows.data.length].join(" | ")
              )
              .join("\n");
            setCommandResult([...commandResult, `${header}\n${content}`]);
          }
        } else {
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
        }
        break;

      case "up":
        if (commandParams.length <= 4) {
          toast(
            toast.types.success,
            `This "up" command could take a long time to execute. Please wait`
          );
          getValidFolderPath(
            currentParent.id,
            commandParams[1],
            PathType.PATH
          ).then((res) => {
            if (res.id && res.name) {
              if (commandParams[2]) {
                let dataUpdate: any = {
                  id: Number(res.id),
                  name: commandParams[2],
                };

                if (commandParams[3]) {
                  dataUpdate = {
                    ...dataUpdate,
                    data: commandParams[3].replace("[", "").replace("]", ""),
                  };
                }

                axios.put(API_URL_FILE_STORAGE, dataUpdate).then((res) => {
                  if (res.data.statusCode === 200) {
                    mutate();
                    setCommandResult([
                      ...commandResult,
                      `Update item successfully`,
                    ]);
                  }
                });
              } else {
                setCommandResult([
                  ...commandResult,
                  `Missing name param. Please try again`,
                ]);
              }
            }
          });
        } else {
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
        }
        break;

      case "mv":
        if (commandParams.length <= 3) {
          const movedItemPath = getValidFolderPath(
            currentParent.id,
            commandParams[1],
            PathType.PATH
          );
          const targetItemPath = getValidFolderPath(
            currentParent.id,
            commandParams[2],
            PathType.FOLDER_PATH
          );
          Promise.all([movedItemPath, targetItemPath]).then((values) => {
            console.log("values", values);
          });
        } else {
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
        }
        break;

      case "rm":
        break;

      case "clear":
        setCommandResult([]);
        break;

      default:
        setCommandResult([...commandResult, val]);
        break;
    }
  };

  return (
    <div className="flex p-4 mt-4 space-x-2 border border-gray-300 border-gray">
      <div className="w-3/4 border-r border-gray-300 ">
        <div className="mb-2 text-xl"> Terminal</div>
        <div className="space-y-4">
          {commandResult.length
            ? commandResult.map((item, index) => {
                return (
                  <div className="flex space-x-4" key={index}>
                    <div>{">>>"}</div>
                    <textarea
                      value={item}
                      rows={item.length > 50 ? 4 : 2}
                      onChange={() => void 0}
                      style={{ width: "100%" }}
                    ></textarea>
                  </div>
                );
              })
            : ""}
        </div>

        <div className="flex items-center mt-8 space-x-2">
          <div>
            {currentPath.length ? (
              <div className="flex">
                {currentPath.map((item, index) => {
                  return <div key={index}>/{item.name}</div>;
                })}
              </div>
            ) : (
              "/home"
            )}
          </div>
          <div className="w-3/4">
            <Input
              value={value}
              setValue={setValue}
              onKeyDown={(e) => {
                if (e.key === "ArrowUp") {
                  if (commandHistoryIndex >= 0) {
                    setValue(command[commandHistoryIndex]);
                    setCommandHistoryIndex(commandHistoryIndex - 1);
                  }
                } else if (e.key === "ArrowDown") {
                  if (commandHistoryIndex < command.length - 1) {
                    setValue(command[commandHistoryIndex + 1]);
                    setCommandHistoryIndex(commandHistoryIndex + 1);
                  }
                }
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  setCommand([...command, value]);
                  handleCommands(value);
                }
              }}
            />
          </div>
        </div>
      </div>
      <div className="w-1/4 space-y-2">
        <div className="text-lg"> Terminal tips</div>
        <div>
          - You can use{" "}
          <span className="p-1 text-pink-500 bg-gray-300">clear</span> &nbsp;to
          clear previous commands.
        </div>
        <div>- You can use arrow up/down to get previous commands.</div>

        <div>
          - When you in lower child directory and you want to update/move/delete
          an item, you should use{" "}
          <span className="p-1 text-pink-500 bg-gray-300">../</span> &nbsp;
          syntax to access higher parent directory.
        </div>
      </div>
    </div>
  );
};

export default Terminal;
