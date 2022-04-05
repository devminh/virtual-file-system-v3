import React, { useState } from "react";
import { Button, Dialog, Input, Tag, TextArea, toast } from "@moai/core";
import { ShowTextFileProps } from "./interface";

const ShowTextFile = ({
  fileName,
  data,
  setVisible,
  submitItem,
}: ShowTextFileProps): JSX.Element => {
  const [textFileName, setTextFileName] = useState<string>(
    fileName.replace(".txt", "")
  );
  const [textData, setTextData] = useState<string>(data);

  return (
    <Dialog onEsc={() => setVisible(false)}>
      <div className="p-4 space-y-4">
        <div>File name: </div>
        <div className="flex items-center">
          <Input value={textFileName} setValue={setTextFileName} />
        </div>

        <div>File data: </div>
        <TextArea value={textData} setValue={setTextData} />

        <div className="flex space-x-4">
          <Button
            highlight
            type="button"
            onClick={() => {
              const regex = /^[a-zA-Z0-9_-]+$/;
              if (regex.test(textFileName)) {
                submitItem(textFileName, textData);
              } else {
                toast(
                  toast.types.failure,
                  "Invalid file type. Please try again"
                );
              }
            }}
          >
            Update
          </Button>
          <Button type="button" onClick={() => setVisible(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default ShowTextFile;
