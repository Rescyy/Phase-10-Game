export class ChatMessage {
    constructor() {
        this.label = null; // bold
        this.message = null;
    }

    static playerJoined(player) {
        const chatMessage = new ChatMessage();
        chatMessage.label = `${player.username} joined.`;
        return chatMessage;
    }

    static playerSaid(player, message) {
        const chatMessage = new ChatMessage();
        chatMessage.label = `${player.username}:`;
        chatMessage.message = message;
        return chatMessage;
    }
}