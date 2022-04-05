import { Input } from "@moai/core";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_URL_FILE_STORAGE } from "../../constants/endpoint";
import { PathAddress } from "../folder-details/interface";
import { TerminalPageProps } from "./interface";
import { checkValidFolderPath } from "./utils";

const Terminal = ({ rootFolder }: TerminalPageProps): JSX.Element => {
  const [command, setCommands] = useState<string[]>([]);
  const [value, setValue] = useState<string>("");

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

  const handleCommands = (val: string) => {
    const commandParams = val.replace(/\s+/g, " ").split(" ");
    switch (commandParams[0]) {
      case "ls":
        // const header = ["name", "created_at"].join(" | ");
        const content = childItems
          .map((rows: any): string => [rows.name].join(""))
          .join(" | ");
        setCommands([...command, `${content}`]);
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

          default:
            const childFolder = childItems.find(
              (item) => item.name === commandParams[1] && item.type === "folder"
            );

            // const childFolder2 = checkValidFolderPath(
            //   currentParent.id,
            //   commandParams[1]
            // );

            // console.log("childFolder", childFolder);

            if (childFolder) {
              setCurrentParent({ id: childFolder.id, name: childFolder.name });
            } else {
              setCommands([
                ...command,
                `Not found  ${commandParams[1]} folder`,
              ]);
            }
            break;
        }
        break;
      case "cat":
        const childFile = childItems.find(
          (item) => item.name === commandParams[1] && item.type === "file"
        );
        if (childFile) {
          setCommands([...command, childFile.data]);
        } else {
          setCommands([...command, `Not found  ${commandParams[1]} file`]);
        }
        break;
      case "clear":
        setCommands([]);
        break;
      default:
        setCommands([...command, val]);
        break;
    }
  };

  return (
    <div className="p-4 border-t border-gray-300 border-gray">
      <div className="text-xl"> Terminal</div>
      {command.length
        ? command.map((item, index) => {
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
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleCommands(value);
                setValue("");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;
