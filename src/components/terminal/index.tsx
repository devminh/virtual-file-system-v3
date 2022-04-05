import { Input } from "@moai/core";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL_FILE_STORAGE } from "../../constants/endpoint";
import { PathAddress } from "../folder-details/interface";
import { PathType, TerminalPageProps } from "./interface";
import { getValidFolderPath } from "./utils";

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

  const [childItems, setChildItems] = useState<any[]>([]);

  //whenever cd a folder, install all children locally.
  useEffect(() => {
    if (currentParent.id) {
      const existPathIndex = currentPath.findIndex(
        (item) =>
          item.id === currentParent.id && item.name === currentParent.name
      );

      if (existPathIndex === -1) {
        setCurrentPath([
          ...currentPath,
          { id: currentParent.id, name: currentParent.name },
        ]);
      } else {
        setCurrentPath(currentPath.slice(0, existPathIndex + 1));
      }

      axios
        .get(`${API_URL_FILE_STORAGE}/?parent_id=${currentParent.id}`)
        .then((res) => {
          if (res.data) {
            setChildItems(res.data);
          }
        });
    }
  }, [currentParent]);

  useEffect(() => {
    if (command.length) {
      setCommandHistoryIndex(command.length - 1);
    }
  }, [command]);

  const handleCommands = (val: string) => {
    setValue("");
    console.log("val", val);
    const commandParams = val ? val.replace(/\s+/g, " ").split(" ") : val;
    switch (commandParams[0]) {
      case "ls":
        // const header = ["name", "created_at"].join(" | ");
        const content = childItems
          .map((rows: any): string => [rows.name].join(""))
          .join(" | ");
        setCommandResult([...commandResult, `${content}`]);
        break;
      case "cd":
        //path folder, find each folder if they exist name,parentId === previousOne
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
            getValidFolderPath(
              currentParent.id,
              commandParams[1],
              PathType.FOLDER_PATH
            ).then((res) => {
              if (res.id && res.name) {
                setCurrentParent({
                  id: res.id,
                  name: res.name,
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
        break;
      case "cat":
        //if last item exist, check whether it is a file or not

        getValidFolderPath(
          currentParent.id,
          commandParams[1],
          PathType.FILE_PATH
        ).then((res) => {
          if (res.id && res.name && res.type === "file") {
            setCommandResult([...commandResult, res.data || ""]);
          } else {
            setCommandResult([
              ...commandResult,
              `Wrong path. Please try again`,
            ]);
          }
        });

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
    <div className="p-4 border-t border-gray-300 border-gray">
      <div className="text-xl"> Terminal</div>
      {commandResult.length
        ? commandResult.map((item, index) => {
            return (
              <div className="flex space-x-2" key={index}>
                {currentPath.length ? (
                  <div className="flex">
                    {currentPath.map((item, index) => {
                      return <div key={index}>/{item.name}</div>;
                    })}
                  </div>
                ) : (
                  "/home"
                )}
                <div>{item}</div>
              </div>
            );
          })
        : ""}
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
  );
};

export default Terminal;
