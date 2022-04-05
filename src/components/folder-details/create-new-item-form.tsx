import React, { useState } from "react";
import { Button, Dialog, Input, Tag, TextArea, toast } from "@moai/core";
import { CreateNewFileFormProps, CreateNewItemType } from "./interface";
const CreateNewItemForm = ({
  setVisible,
  submitItem,
  itemType,
}: CreateNewFileFormProps): JSX.Element => {
  const [fileName, setFileName] = useState<string>("");
  const [data, setData] = useState<string>("");

  return (
    <Dialog onEsc={() => setVisible(false)}>
      <div className="space-y-4 p-4">
        <div className="text-lg">Create a new {itemType}</div>

        <div>{itemType} name: </div>
        <div className="flex items-center">
          <Input value={fileName} setValue={setFileName} />
          {itemType === CreateNewItemType.FILE && (
            <Tag color={Tag.colors.indigo}>.txt</Tag>
          )}
        </div>

        {itemType === CreateNewItemType.FILE && (
          <div>
            <div>File data: </div>
            <TextArea value={data} setValue={setData} />
          </div>
        )}

        <div className="flex space-x-4">
          <Button
            highlight
            type="button"
            onClick={() => {
              const regex = /^[a-zA-Z0-9_-]+$/;
              if (regex.test(fileName)) {
                submitItem(fileName, data);
              } else {
                toast(
                  toast.types.failure,
                  "Invalid file type. Please try again"
                );
              }
            }}
          >
            Create
          </Button>
          <Button type="button" onClick={() => setVisible(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateNewItemForm;
