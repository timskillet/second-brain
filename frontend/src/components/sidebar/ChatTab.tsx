import { Ellipsis } from "lucide-react";
import React, { useState } from "react";

interface ChatTabProps {
  chatId: string;
  chatName: string;
  onChatSelect: (chatId: string) => void;
}

function ChatTab({ chatId, chatName, onChatSelect }: ChatTabProps) {
  const [chatHovering, setChatHovering] = useState(false);
  const [ellipsisHovering, setEllipsisHovering] = useState(false);

  return (
    <div
      onMouseEnter={() => setChatHovering(true)}
      onMouseLeave={() => setChatHovering(false)}
      key={chatId}
      onClick={() => {
        console.log("ChatTab: Selecting chat:", chatId);
        onChatSelect(chatId);
      }}
    >
      <div className="cursor-pointer">
        <div
          className={`flex justify-between p-2 items-center rounded-lg flex-1 ${
            chatHovering && !ellipsisHovering && "bg-hover"
          }`}
        >
          <span className="flex-1 text-xl text-gray-300 truncate">
            {chatName}
          </span>
          <Ellipsis
            onMouseEnter={() => setEllipsisHovering(true)}
            onMouseLeave={() => setEllipsisHovering(false)}
            className={`text-gray-300 ${!chatHovering && "hidden"} ${
              ellipsisHovering && "rounded-lg bg-hover"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatTab;
