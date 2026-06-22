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

  // Position with `fixed` (x/y are viewport clientX/clientY) and clamp so the
  // menu never overflows the viewport edges. Width is w-60 (240px).
  const MENU_W = 240;
  const estHeight = (menuItems?.length ?? 0) * 38 + 8;
  const left =
    typeof window !== "undefined"
      ? Math.min(x, window.innerWidth - MENU_W - 8)
      : x;
  const top =
    typeof window !== "undefined"
      ? Math.min(y, window.innerHeight - estHeight - 8)
      : y;

  return (
    <div
      className="fixed bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/80 text-popover-foreground border border-border shadow-lg rounded-md py-1 w-60 z-[9999]"
      style={{ top, left }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems?.map((item, i) => {
        return item.label === "separator" ? (
          <div key={i} className="my-0.5 bg-border h-[1px]"></div>
        ) : (
          <div
            key={i}
            onClick={() => {
              item.action();
              onAction(item.label);
              onClose();
            }}
            className="px-3 py-2 text-sm cursor-pointer text-foreground hover:bg-primary hover:text-primary-foreground"
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
};
