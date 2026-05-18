// ContextMenu.tsx
import React, { useState } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  target: any;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  target,
  visible,
  onClose,
  onAction,
}) => {
  const [newItemName, setNewItemName] = useState("");
  if (!visible) return null;

  const handleNewItem = (parentPath: string, type: "file" | "folder") => {
    // setCreatingItem({ parentPath, type });
    setNewItemName("");
  };

  const commonActions = [
    { label: "Rename", action: () => console.log("Rename", target.name) },
    { label: "Delete", action: () => console.log("Delete", target.path) },
  ];
  const folderActions = [
    {
      label: "New File",
      action: () => handleNewItem(target.path, "file"),
    },
    {
      label: "New Folder",
      action: () => handleNewItem(target.path, "folder"),
    },

    {
      label: "separator",
      action: () => {},
    },

    {
      label: "Open in Terminal",
      action: () => console.log("Open Folder in Terminal", target.path),
    },

    {
      label: "separator",
      action: () => {},
    },
    ...commonActions,
  ];
  const fileActions = [
    { label: "Open", action: () => console.log("Open", target.path) },
    ...commonActions,
  ];

  const menuItems = target.type === "folder" ? folderActions : fileActions;

  return (
    <div
      className="absolute bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-white shadow-lg rounded-md py-1 w-60 z-50"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems?.map((item, i) => {
        return item.label === "separator" ? (
          <div key={i} className="my-0.5 bg-gray-700 h-[1px]"></div>
        ) : (
          <div
            key={i}
            onClick={() => {
              item.action();
              onAction(item.label);
              onClose();
            }}
            className="px-3 my- py-2 hover:bg-primary cursor-pointer text-sm"
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
};
