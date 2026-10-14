export const PlayerConnectionState = {
    NONE: 'none',
    HEALTHY: 'healthy',
    STALE: 'stale', // pong not received
}

export class PlayerSession {
    constructor(player, ws) {
        this.player = player;
        this.ws = ws;
        this.pendingRequests = new Map();
        this.messageListeners = new Map();
        this.unstalePromise = null;
        this.unstaleResolve = null;
        this.setPlayerConnected();
        ws.on('message', async (message) => await this.handleMessage(message));
        ws.on('close', (event) => this.handleClose(event));
        ws.on('error', (error) => this.handleError(error));
    }

    async handleMessage(message) {
        if (this.connectionState === PlayerConnectionState.STALE) {
            console.log(`Player ${this.player.privateId} became unstale, resending requests`);
            this.setPlayerConnected();
        }

        const messageJson = JSON.parse(message.toString());

        switch (messageJson.direction) {
            case 'request':
                await this.handleRequest(messageJson);
                break;
            case 'response':
                this.handleResponse(messageJson);
                break;
            default:
                throw new Error("Received unknown message direction:", message);
        }
    }

    async handleRequest(message) {
        if (this.messageListeners.has(message.name)) {
            const payload = await (this.messageListeners.get(message.name))(this, message.payload);
            const responseMessage = {
                id: message.id,
                direction: 'response',
                payload,
            };

            await this.sendCore(JSON.stringify(responseMessage));
        } else {
            throw new Error("Received unknown message:", message);
        }
    }

    handleResponse(message) {
        if (this.pendingRequests.has(message.id)) {
            const {
                resolve, timeoutId
            } = this.pendingRequests.get(message.id);

            clearTimeout(timeoutId);

            resolve(message.payload);

            this.pendingRequests.delete(message.id);
        } else {
            console.log(message);
            throw new Error(`Received stray response`);
        }
    }

    handleClose(code) {
        console.log(`Player ${this.player.privateId} closed connection. Code: `, code);

        switch (code) {
            case 1000:
            case 1002:
            case 1003:
            case 1007:
            case 1008:
            case 1009:
            case 1015:
                this.setPlayerClose();
                break;
            default:
                this.setPlayerStale('Connection closed');
                break;
        }
    }

    handleError(error) {
        console.error("Web socket error:", error);
        this.setPlayerClose();
    }

    setPlayerConnected() {
        this.connectionState = PlayerConnectionState.HEALTHY;
        this.unstaleResolve?.();
        this.pingConnection();
        Promise.allSettled([...this.pendingRequests.values()].map(async value => {
            const timeoutId = setTimeout(() => {
                this.setPlayerStale('Resend: Response not received');
            }, 5 * 1000);

            value.timeoutId = timeoutId;
        }));
    }

    setPlayerStale(reason) {
        this.connectionState = PlayerConnectionState.STALE;
        clearTimeout(this.pingTimeoutId);
        console.log(`Player ${this.player.privateId} connection stale. Reason: ${reason}`);
        
        this.unstalePromise = new Promise((resolve) => {
            this.unstaleResolve = resolve;
        });

        this.pendingRequests.forEach((value) => {
            const { timeoutId } = value;
            clearTimeout(timeoutId);
        });
    }

    setPlayerClose() {
        this.connectionState = PlayerConnectionState.NONE;
        this.unstaleResolve?.();
        this.pendingRequests.forEach((value) => {
            const { reject, timeoutId } = value;
            clearTimeout(timeoutId);
            reject("Connection closed");
        });
        this.pendingRequests.clear();
    }

    async sendMessage(name, payload) {
        const messageId = crypto.randomUUID();
        
        const message = {
            id: messageId,
            direction: 'request',
            name,
        };

        if (payload) {
            message.payload = payload;
        }

        await new Promise(async (resolve, reject) => {
            await this.sendCore(JSON.stringify(message));
            
            const timeoutId = setTimeout(() => {
                this.setPlayerStale('Send: Response not received');
            }, 5 * 1000);

            this.pendingRequests.set(messageId, { message, resolve, reject, timeoutId });
        });
    }

    async sendCore(rawPayload) {
        await this.ensureUnstale();

        if (this.connectionState === PlayerConnectionState.HEALTHY) {
            this.ws.send(rawPayload);
        }

        if (this.connectionState === PlayerConnectionState.NONE) {
            throw new Error("Cannot send payload to disconnected player");
        }
    }

    async ensureUnstale() {
        if (this.connectionState === PlayerConnectionState.STALE) {
            await this.unstalePromise;
        }
    }

    pingConnection() {
        this.pingTimeoutId = setTimeout(async () => {
            await this.ensureUnstale();
    
            if (this.connectionState === PlayerConnectionState.HEALTHY) {
                await this.sendMessage('ping')
                    .then(() => this.pingConnection())
                    .catch((e) => {
                        console.error("PingConnection error: ", e);
                    });
            }
        }, 5 * 1000);
    }

    listenMessage(name, func) {
        if (typeof func !== 'function') {
            throw new Error("Expected func to be function");
        }
        this.messageListeners.set(name, func);
    }
}