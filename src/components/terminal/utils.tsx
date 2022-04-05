import axios from "axios";

const fetchData = async (id: string, name: string) => {
  const res = await axios
    .get(`http://localhost:5000/api/file-storage/?parent_id=${id}&name=${name}`)
    .then((res: any) => {
      console.log("res", res);

      if (res.data.length) {
        return res.data[0].id;
      } else {
        return null;
      }
    });
  return res;
};

export const checkValidFolderPath = async (currentId: string, path: string) => {
  const folders = path.split("/");

  folders.forEach(async (name, index) => {
    let tempid;
    let fetch = await fetchData(tempid || currentId, name);
    if (fetch) {
      tempid = fetch;
    } else {
      return "Not find";
    }
  });
};
