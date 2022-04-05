import axios from "axios";
import { API_URL_FILE_STORAGE } from "../../constants/endpoint";
import { Folder } from "../folder-details/interface";
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

export const getValidFolderPath = async (
  currentId: string,
  path: string,
  pathType: PathType
) => {
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
