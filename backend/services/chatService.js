export class ChatService {
    constructor(repository) {
        this.repository = repository;
    }

    postMessage(room, chatMessage) {
        room.chatMessages.push(chatMessage);
    }
} 