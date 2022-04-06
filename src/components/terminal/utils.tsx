import axios from "axios";
import { API_URL_FILE_STORAGE } from "../../constants/endpoint";
import { Folder, PathAddress } from "../folder-details/interface";
import { PathType } from "./interface";

const getChildrenItem = async (
  parentId: string,
  name: string,
  pathType: PathType
) => {
  let url = `${API_URL_FILE_STORAGE}/?parent_id=${parentId}&name=${name}`;

  if (pathType === PathType.FOLDER_PATH) {
    url += "&type=folder";
  }

  const res = await axios.get(url).then((res: any) => {
    if (res.data.length) {
      return res.data[0];
    } else {
      return null;
    }
  });
  return res;
};

//this function use to check and get last valid file/folder
export const getValidFolderPath = async (
  currentId: string,
  path: string,
  pathType: PathType
) => {
  if (path[0] === "/") {
    path = path.slice(1);
  }
  const folders = path.split("/");
  let parent: Folder = {
    id: "",
    parent_id: "",
    name: "",
    type: "",
    data: "",
    created_at: "",
  };
  let index = 0;
  while (index < folders.length) {
    let fetch = await getChildrenItem(
      parent.id || currentId,
      folders[index],
      pathType
    );
    if (fetch) {
      parent = fetch;
    } else {
      parent = {
        id: "",
        parent_id: "",
        name: "",
        type: "",
        data: "",
        created_at: "",
      };
      break;
    }
    index += 1;
  }
  return parent;
};

//this function use to check and get all valid folder
export const getValidCurrentFolderPath = async (
  currentId: string,
  path: string,
  pathType: PathType
) => {
  if (path[0] === "/") {
    path = path.slice(1);
  }
  const folders = path.split("/");

  let folderPaths: PathAddress[] = [];

  if (folders.length) {
    let parentId = "";

    let index = 0;
    while (index < folders.length) {
      let fetch = await getChildrenItem(
        parentId || currentId,
        folders[index],
        pathType
      );
      if (fetch) {
        parentId = fetch.id;
        folderPaths.push({ id: fetch.id, name: fetch.name });
      } else {
        folderPaths = [];
        break;
      }
      index += 1;
    }
  } else {
    // const result = await axios.get(`${API_URL_FILE_STORAGE}/?parent_id=${currentId}&type=${pathType}`)
  }

  return folderPaths;
};

// let count = 0;
// let path = "../../";

// while (path.length > 0) {
//   if (path.indexOf("../") === 0) {
//     path = path.slice(path.indexOf("../"), path.lastIndexOf("../"));
//     count++;
//   } else {
//     break;
//   }
// }
