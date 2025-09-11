import axios from "axios";
import type { Chat, Message, Personality } from "../types";
import { extractFilesAndSanitize } from "../utils";

const api = axios.create({
    baseURL: "http://localhost:8002",
    headers: {
        "Content-Type": "application/json",
    }
});

const chatService = {
    // Get all personalities
    async getPersonalities(): Promise<Personality[]> {
        try {
            const response = await api.get<Personality[]>("/personalities");
            return response.data;
        } catch (error) {
            console.error("Error fetching personalities:", error);
            throw new Error("Failed to fetch personalities");
        }
    },

    // Get all chats
    async getChats(): Promise<Chat[]> {
        try {
            const response = await api.get<Chat[]>("/chats");
            return response.data;
        } catch (error) {
            console.error("Error fetching chats:", error);
            throw new Error("Failed to fetch chats");
        }
    },

    // Get specific chat with messages
    async getChat(chatId: string): Promise<Message[]> {
        try {
            const response = await api.get<Message[]>(`/chats/${chatId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching chat:", error);
            throw new Error("Failed to fetch chat");
        }
    },

    // Delete chat
    async deleteChat(chatId: string): Promise<void> {
        try {
            await api.delete(`/chats/${chatId}`);
        } catch (error) {
            console.error("Error deleting chat:", error);
            throw new Error("Failed to delete chat");
        }
    },

    // Create new chat
    async createChat(title: string, personalityId: string = "assistant"): Promise<Chat> {
        try {
            const response = await api.post("/chats", null, {
                params: { 
                    chat_title: title,
                    personality_id: personalityId
                }
            });
            return {
                id: response.data.id,
                title: response.data.title,
                created_at: response.data.created_at,
                updated_at: response.data.updated_at,
                personality_id: response.data.personality_id || "assistant"
            }
        } catch (error) {
            console.error("Error creating chat:", error);
            throw new Error("Failed to create chat");
        }
    },

    // Update chat title
    async updateChatTitle(chatId: string, title: string): Promise<void> {
        try {
            await api.put(`/chats/${chatId}`, { title });
        } catch (error) {
            console.error("Error updating chat title:", error);
            throw new Error("Failed to update chat title");
        }
    },

    // Update chat personality
    async updateChatPersonality(chatId: string, personalityId: string): Promise<void> {
        try {
            await api.put(`/chats/${chatId}/personality`, { personality_id: personalityId });
        } catch (error) {
            console.error("Error updating chat personality:", error);
            throw new Error("Failed to update chat personality");
        }
    },

    // Duplicate chat (create new chat with same title + "Copy")
    async duplicateChat(originalChatId: string, originalTitle: string, personalityId: string = "assistant"): Promise<Chat> {
        try {
            const newTitle = `${originalTitle} (Copy)`;
            return await this.createChat(newTitle, personalityId);
        } catch (error) {
            console.error("Error duplicating chat:", error);
            throw new Error("Failed to duplicate chat");
        }
    },

    // Stream message
    async streamMessage(
        chatId: string,
        message: string,
        onToken?: (token: string) => void,
        personalityId: string = "assistant"
    ): Promise<string> {
        try {
            const { files, sanitizedInput } = extractFilesAndSanitize(message);
            console.log("Files:", files);
            console.log("Sanitized input:", sanitizedInput);
            const response = await fetch(`http://localhost:8002/chat/${chatId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    message: sanitizedInput, 
                    files: files, 
                    personality_id: personalityId,
                    created_at: new Date().toISOString() 
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Response body is not readable");
            }
            const decoder = new TextDecoder();
            let result = "";

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    const chunk = decoder.decode(value, { stream: true });

                    // Handle special markers
                    if (chunk.includes("[END]")) {
                        // Remove the end marker and break
                        const cleanChunk = chunk.replace("[END]", "");
                        if (cleanChunk && onToken) {
                            onToken(cleanChunk);
                        }
                        result += cleanChunk;
                        break;
                    }

                    if (chunk.includes("[ERROR]")) {
                        // Handle error marker
                        const errorMsg = chunk.replace("[ERROR]", "");
                        throw new Error(errorMsg || "Streaming error occurred");
                    }
                    
                    result += chunk;

                    // Call the callback for each token to create typewriter effect
                    if (onToken) {
                        onToken(chunk);
                    }
                }
            } finally {
                reader.releaseLock();
            }

            return result;
        } catch (error) {
            console.error("Error streaming message:", error);
            throw new Error("Failed to send message");
        }
    },
}

export default chatService;