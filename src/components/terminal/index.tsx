import { Button, Input, toast } from "@moai/core";
import axios from "axios";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { NAME_REGEX } from "../../constants";
import { API_URL_FILE_STORAGE } from "../../constants/endpoint";
import { fetcherSWR, removeRangeString } from "../../utils";
import { Folder, PathAddress } from "../folder-details/interface";
import { FolderLs, PathType, TerminalPageProps } from "./interface";
import {
  getAllPosiblePath,
  getValidCurrentFolderPath,
  getValidItemPath,
} from "./utils";

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
              let tempPath: PathAddress[] = currentPath;
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
                if (j >= 0) {
                  parentId = currentPath[j].id;
                  tempPath = [...currentPath.slice(0, j + 1)];
                  parentId = currentPath[j].id;
                } else {
                  parentId = "";
                }
              }
              //detect parent path as ../../

              setTimeout(() => {
                if (!tempCommand && parentId) {
                  setCurrentParent(currentPath[j]);
                  setCurrentPath(tempPath);
                } else if (parentId) {
                  getValidCurrentFolderPath(
                    parentId,
                    tempCommand,
                    PathType.FOLDER_PATH
                  ).then((res) => {
                    if (res.length) {
                      setCurrentPath([...tempPath, ...res]);

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
                } else {
                  setCommandResult([
                    ...commandResult,
                    `Wrong path. Please try again`,
                  ]);
                }
              }, 500);

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
          let pathName = commandParams[1];
          let dataName = commandParams[2];
          let optionalParam = "";

          if (commandParams[1] === "-p") {
            optionalParam = commandParams[1];
            pathName = commandParams[2];
            dataName = commandParams[3];
          }
          //detect parent path as ../../
          let parentId = currentParent.id;
          let tempCommand = pathName;
          let parentPath = commandParams[1].match(/(\.\.\/)/g);

          let j = currentPath.length - 1;
          if (parentPath?.length) {
            tempCommand = tempCommand.replace(parentPath.join(""), "");

            for (let i = 0; i < parentPath?.length; i++) {
              j--;
            }
            if (j >= 0) {
              parentId = currentPath[j].id;
            } else {
              parentId = "";
            }
          }

          let tempCommandArr = tempCommand.split("/");

          //detect parent path as ../../
          if (
            parentId &&
            tempCommandArr.length === 1 &&
            NAME_REGEX.test(tempCommand)
          ) {
            //this case the parent folder using ../ has found
            let itemBody = {
              name: tempCommand,
              type: "folder",
              data: "",
              parent_id: parentId,
            };
            if (dataName) {
              itemBody.type = "file";
              itemBody.data = dataName;
            }

            axios.post(API_URL_FILE_STORAGE, itemBody).then((res) => {
              if (res.data.statusCode === 200) {
                setCommandResult([
                  ...commandResult,
                  `Create new item "${tempCommand}" successfully`,
                ]);
                mutate();
              } else {
                setCommandResult([...commandResult, `Fail to create new item`]);
              }
            });
          } else if (
            parentId &&
            NAME_REGEX.test(tempCommandArr[tempCommandArr.length])
          ) {
            let newName = tempCommandArr.pop(); //last value
            getAllPosiblePath(
              parentId,
              tempCommandArr.join("/"),
              PathType.FOLDER_PATH
            ).then((res) => {
              console.log("Res", res);
              let itemBody = {
                name: newName,
                type: "folder",
                data: "",
                parent_id: res[res.length - 1].id,
              };
              if (dataName) {
                itemBody.type = "file";
                itemBody.data = dataName;
              }

              if (optionalParam === "-p") {
                toast(
                  toast.types.success,
                  `This "cr" with [-p] command could take a long time to execute. Please wait`
                );
                //the path must have valid ids from 0 to arr.length-2
                let newMissingParent = res.pop();
                if (res.every((item) => item.id)) {
                  //all parentFolder is valid
                  let createMissingParent = axios.post(API_URL_FILE_STORAGE, {
                    name: newMissingParent?.name,
                    type: "folder",
                    data: "",
                    parent_id: res[res.length - 1].id,
                  });
                  createMissingParent.then((res) => {
                    if (res.data.statusCode === 200) {
                      itemBody.parent_id = res.data.id;

                      axios.post(API_URL_FILE_STORAGE, itemBody).then((res) => {
                        if (res.data.statusCode === 200) {
                          setCommandResult([
                            ...commandResult,
                            `Create new item "${tempCommand}" successfully`,
                          ]);
                          mutate();
                        } else {
                          setCommandResult([
                            ...commandResult,
                            `Fail to create new item`,
                          ]);
                        }
                      });
                    }
                  });
                }
              } else if (res.every((item) => item.id)) {
                //all parentFolder is valid
                axios.post(API_URL_FILE_STORAGE, itemBody).then((res) => {
                  if (res.data.statusCode === 200) {
                    setCommandResult([
                      ...commandResult,
                      `Create new item "${tempCommand}" successfully`,
                    ]);
                    mutate();
                  } else {
                    setCommandResult([
                      ...commandResult,
                      `Fail to create new item`,
                    ]);
                  }
                });
              }
            });
          }
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
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
          getValidItemPath(parentId, tempCommand, PathType.FILE_PATH).then(
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

        if (commandParams[1]) {
          toast(
            toast.types.success,
            `This "ls [FOLDER_PATH]" command could take a long time to execute. Please wait`
          );
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
            if (j >= 0) {
              parentId = currentPath[j].id;
            } else {
              parentId = "";
            }
          }

          //detect parent path as ../../

          if (!tempCommand && parentId) {
            axios
              .get(`${API_URL_FILE_STORAGE}/?parent_id=${parentId}`)
              .then((val) => {
                if (val.data.length) {
                  const content: any[] = [];
                  val.data.forEach(async (rows: any) => {
                    let size: any = rows.data.length;
                    if (rows.type === "folder") {
                      const res = await axios.get(
                        `${API_URL_FILE_STORAGE}/count-item/${rows.id}`
                      );
                      size = res.data.count;
                    }
                    content.push({
                      name: rows.name,
                      created_at: rows.created_at,
                      size: Number(size),
                    });
                  });

                  setTimeout(() => {
                    const contentTemp = content
                      .map((rows) => {
                        return [rows.name, rows.created_at, rows.size].join(
                          " | "
                        );
                      })
                      .join("\n");

                    setCommandResult([
                      ...commandResult,
                      `${header}\n${contentTemp}`,
                    ]);
                  }, 500);
                }
              });
          } else if (parentId) {
            getValidItemPath(parentId, tempCommand, PathType.FOLDER_PATH).then(
              (res) => {
                if (res.id) {
                  axios
                    .get(`${API_URL_FILE_STORAGE}/?parent_id=${res.id}`)
                    .then((val) => {
                      if (val.data.length) {
                        const content: any[] = [];
                        val.data.forEach(async (rows: any) => {
                          let size: any = rows.data.length;
                          if (rows.type === "folder") {
                            const res = await axios.get(
                              `${API_URL_FILE_STORAGE}/count-item/${rows.id}`
                            );
                            size = res.data.count;
                          }
                          content.push({
                            name: rows.name,
                            created_at: rows.created_at,
                            size: Number(size),
                          });
                        });

                        setTimeout(() => {
                          const contentTemp = content
                            .map((rows) => {
                              return [
                                rows.name,
                                rows.created_at,
                                rows.size,
                              ].join(" | ");
                            })
                            .join("\n");

                          setCommandResult([
                            ...commandResult,
                            `${header}\n${contentTemp}`,
                          ]);
                        }, 500);
                      }
                    });
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
              `Wrong path. Please try again`,
            ]);
          }
        } else {
          let tempChildItems: FolderLs[] = [];

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
        }

        break;

      case "find":
        if (commandParams.length <= 3) {
          const header = ["name", "created_at", "size"].join(" | ");

          if (commandParams[2]) {
            //find based folder path
            toast(
              toast.types.success,
              `This "find name FOLDER_PATH" command could take a long time to execute. Please wait`
            );
            let parentId = currentParent.id;
            let tempCommand = commandParams[2];

            //detect parent path as ../../
            let parentPath = commandParams[2].match(/(\.\.\/)/g);

            let j = currentPath.length - 1;
            if (parentPath?.length) {
              tempCommand = tempCommand.replace(parentPath.join(""), "");

              for (let i = 0; i < parentPath?.length; i++) {
                j--;
              }
              parentId = currentPath[j].id;
            }
            //detect parent path as ../../

            if (!tempCommand) {
              axios
                .get(`${API_URL_FILE_STORAGE}/?parent_id=${parentId}`)
                .then((val) => {
                  if (val.data.length) {
                    const content: any[] = [];
                    val.data.forEach(async (rows: any) => {
                      let size: any = rows.data.length;
                      if (rows.type === "folder") {
                        const res = await axios.get(
                          `${API_URL_FILE_STORAGE}/count-item/${rows.id}`
                        );
                        size = res.data.count;
                      }
                      content.push({
                        name: rows.name,
                        created_at: rows.created_at,
                        size: Number(size),
                      });
                    });

                    setTimeout(() => {
                      const contentTemp = content
                        .filter((item) => item.name.includes(commandParams[1]))
                        .map((rows) => {
                          return [rows.name, rows.created_at, rows.size].join(
                            " | "
                          );
                        })
                        .join("\n");

                      setCommandResult([
                        ...commandResult,
                        `${header}\n${contentTemp}`,
                      ]);
                    }, 500);
                  }
                });
            } else {
              getValidItemPath(
                parentId,
                tempCommand,
                PathType.FOLDER_PATH
              ).then((res) => {
                if (res.id) {
                  axios
                    .get(`${API_URL_FILE_STORAGE}/?parent_id=${res.id}`)
                    .then((val) => {
                      if (val.data.length) {
                        const content: any[] = [];
                        val.data.forEach(async (rows: any) => {
                          let size: any = rows.data.length;
                          if (rows.type === "folder") {
                            const res = await axios.get(
                              `${API_URL_FILE_STORAGE}/count-item/${rows.id}`
                            );
                            size = res.data.count;
                          }
                          content.push({
                            name: rows.name,
                            created_at: rows.created_at,
                            size: Number(size),
                          });
                        });

                        setTimeout(() => {
                          const contentTemp = content
                            .filter((item) =>
                              item.name.includes(commandParams[1])
                            )
                            .map((rows) => {
                              return [
                                rows.name,
                                rows.created_at,
                                rows.size,
                              ].join(" | ");
                            })
                            .join("\n");

                          setCommandResult([
                            ...commandResult,
                            `${header}\n${contentTemp}`,
                          ]);
                        }, 500);
                      }
                    });
                } else {
                  setCommandResult([
                    ...commandResult,
                    `Wrong path. Please try again`,
                  ]);
                }
              });
            }
          } else {
            let tempChildItems: FolderLs[] = [];
            const filterChildItem = childItems.filter((item) =>
              item.name.includes(commandParams[1])
            );
            filterChildItem.forEach(async (rows) => {
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
          if (!tempCommand) {
            setCommandResult([
              ...commandResult,
              `Wrong path. Please try again`,
            ]);
          } else {
            getValidItemPath(parentId, tempCommand, PathType.PATH).then(
              (res) => {
                if (res.id && res.name) {
                  if (commandParams[2]) {
                    let dataUpdate: any = {
                      id: Number(res.id),
                      name:
                        commandParams[2] +
                        `${res.type === "file" ? ".txt" : ""}`,
                    };

                    if (commandParams[3] && res.type === "file") {
                      dataUpdate = {
                        ...dataUpdate,
                        data: commandParams[3]
                          .replace("[", "")
                          .replace("]", ""),
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
                } else {
                  setCommandResult([
                    ...commandResult,
                    `Wrong path. Please try again`,
                  ]);
                }
              }
            );
          }
        } else {
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
        }
        break;

      case "mv":
        if (commandParams.length === 3) {
          toast(
            toast.types.success,
            `This "mv" command could take a long time to execute. Please wait`
          );

          //handle move item
          let movedItemPath: any;

          let parentId1 = currentParent.id;
          let tempCommand1 = commandParams[1];

          //detect parent path as ../../
          let parentPath1 = commandParams[1].match(/(\.\.\/)/g);

          let j1 = currentPath.length - 1;
          if (parentPath1?.length) {
            tempCommand1 = tempCommand1.replace(parentPath1.join(""), "");

            for (let i = 0; i < parentPath1?.length; i++) {
              j1--;
            }
            if (j1 >= 0) {
              parentId1 = currentPath[j1].id;
            } else {
              parentId1 = "";
            }
          }
          //detect parent path as ../../
          if (!tempCommand1 && parentId1) {
            setCommandResult([
              ...commandResult,
              `Wrong path. Please try again`,
            ]);
          } else if (parentId1) {
            movedItemPath = getValidItemPath(
              parentId1,
              tempCommand1,
              PathType.PATH
            );
          }
          //handle move item

          //handle targetFolder
          let targetItemPath: any;
          let parentId2 = currentParent.id;
          let tempCommand2 = commandParams[2];

          //detect parent path as ../../
          let parentPath2 = commandParams[2].match(/(\.\.\/)/g);

          let j2 = currentPath.length - 1;

          if (parentPath2?.length) {
            tempCommand2 = tempCommand2.replace(parentPath2.join(""), "");

            for (let i = 0; i < parentPath2?.length; i++) {
              j2--;
            }

            if (j2 >= 0) {
              parentId2 = currentPath[j2].id;
            } else {
              parentId2 = "";
            }
          }

          if (tempCommand2 && parentId2) {
            targetItemPath = getValidItemPath(
              parentId2,
              tempCommand2,
              PathType.FOLDER_PATH
            );
          } else if (parentId2) {
            targetItemPath = currentPath[j2];
          }

          //handle targetFolder

          Promise.all([movedItemPath, targetItemPath]).then((values) => {
            if (values[0].parent_id !== values[1].id) {
              axios
                .put(API_URL_FILE_STORAGE, {
                  id: Number(values[0].id),
                  parent_id: values[1].id,
                })
                .then((res) => {
                  if (res.data.statusCode === 200) {
                    setCommandResult([
                      ...commandResult,
                      `Move item successfully.`,
                    ]);
                  }
                });
            } else {
              setCommandResult([
                ...commandResult,
                `You move item in the same directory.`,
              ]);
            }
          });
        } else {
          setCommandResult([
            ...commandResult,
            `Wrong syntax. Please try again`,
          ]);
        }
        break;

      case "rm":
        toast(
          toast.types.success,
          `This "rm" command could take a long time to execute due to handling many paths. Please wait`
        );
        if (Array.isArray(commandParams)) {
          const tempCommandParams =
            commandParams.slice(1, commandParams.length) || [];
          tempCommandParams.map(async (path) => {
            const pathResult = await getValidItemPath(
              currentParent.id,
              path,
              PathType.PATH
            );
            if (pathResult.id) {
              let deteleResult = await axios.delete(
                `${API_URL_FILE_STORAGE}/${pathResult.id}`
              );
              if (deteleResult) {
                setCommandResult([
                  ...commandResult,
                  `Completed delete ${path}`,
                ]);
              } else {
                setCommandResult([...commandResult, `Fail to  delete ${path}`]);
              }
            } else {
              setCommandResult([...commandResult, `Fail to delete ${path}`]);
            }
          });
        }

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
            <div className="flex space-x-1">
              <Input
                value={value}
                setValue={(value) => {
                  setValue(value);
                  setTimeout(() => {
                    mutate();
                  });
                }}
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
              <Button
                highlight
                onClick={() => {
                  mutate();
                  setCommand([...command, value]);
                  handleCommands(value);
                }}
              >
                Enter
              </Button>
            </div>
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
          - When you in lower child directory and you want to update/move an
          item, you should use{" "}
          <span className="p-1 text-pink-500 bg-gray-300">../</span> &nbsp;
          syntax to access higher parent directory. The{" "}
          <span className="p-1 text-pink-500 bg-gray-300">rm</span> command
          currently does not support using{" "}
          <span className="p-1 text-pink-500 bg-gray-300">../</span>, sorry for
          that inconvenience.
        </div>

        <div>
          The <span className="p-1 text-pink-500 bg-gray-300">./</span>&nbsp; is
          currently not supported, sorry for that inconvenience. If you at that
          directory, just continue to write childitems/.. or using &nbsp;
          <span className="p-1 text-pink-500 bg-gray-300">../</span>
        </div>

        <div>
          - Sometimes a poor connection may interrupt the result your correct
          commands. Please try re-entering the command.
        </div>

        <div>
          - This terminal currently does not allow to have spaced characters,
          sorry for that inconvenience.
        </div>

        <div>
          - With command that use{" "}
          <span className="p-1 text-pink-500 bg-gray-300">[DATA]</span>,
          remember to put it in [].
        </div>
      </div>
    </div>
  );
};

export default Terminal;
