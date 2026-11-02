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
        this.onStaleTime = null;
        this.onStaleFunc = null;
        this.onStaleTimeoutId = null;
        this.unstalePromise = null;
        this.unstaleResolve = null;
        this.onConnectFunc = null;
        this.onDisconnectFunc = null;
        this.registerListeners();
    }

    async handleMessage(message) {
        if (this.connectionState === PlayerConnectionState.STALE) {
            console.log(`Player ${this.player.username} became unstale, resending requests`);
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
            const payload = await (this.messageListeners.get(message.name))(message.payload);
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
        console.log(`Player ${this.player.username} closed connection. Code: `, code);

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
        this.onConnectFunc?.();

        if (this.connectionState === PlayerConnectionState.HEALTHY) {
            return;
        }
        
        this.connectionState = PlayerConnectionState.HEALTHY;
        this.unstaleSession();
        this.pingConnection();
        Promise.allSettled([...this.pendingRequests.values()].map(async value => {
            const timeoutId = setTimeout(() => {
                this.setPlayerStale('Resend: Response not received');
            }, 5 * 1000);
            
            value.timeoutId = timeoutId;
        }));
        clearTimeout(this.onDisconnectTimeoutId);
    }

    setPlayerStale(reason) {
        if (this.connectionState === PlayerConnectionState.STALE) {
            return;
        }

        this.connectionState = PlayerConnectionState.STALE;
        clearTimeout(this.pingTimeoutId);
        console.log(`Player ${this.player.username} connection stale. Reason: ${reason}`);
        
        this.unstalePromise = new Promise(resolve => this.unstaleResolve = resolve);

        this.pendingRequests.forEach((value) => {
            const { timeoutId } = value;
            clearTimeout(timeoutId);
        });

        if (this.onStaleFunc) {
            this.onStaleTimeoutId = setTimeout(this.onStaleFunc, this.onStaleTime);
        }
    }

    setPlayerClose() {
        if (this.connectionState === PlayerConnectionState.NONE) {
            return;
        }

        this.connectionState = PlayerConnectionState.NONE;
        this.unstaleSession();
        clearTimeout(this.pingTimeoutId);
        console.log(`Cleaning ${this.pendingRequests.size} pending requests`);
        this.pendingRequests.forEach((value) => {
            const { resolve, timeoutId } = value;
            clearTimeout(timeoutId);
            resolve("Connection closed");
        });
        this.pendingRequests.clear();
        this.onDisconnectFunc?.();
    }

    unstaleSession() {
        this.unstaleResolve?.();
        clearTimeout(this.onStaleTimeoutId);
    }

    closeSession(reason) {
        this.ws.removeAllListeners();
        this.ws.close(1000, reason);
        this.setPlayerClose();
    }

    async sendMessage(name, payload) {
        await this.ensureUnstale();

        if (this.connectionState === PlayerConnectionState.NONE) {
            return;
        }

        const messageId = crypto.randomUUID();
        
        const message = {
            id: messageId,
            direction: 'request',
            name,
        };

        if (payload) {
            message.payload = payload;
        }

        this.ws.send(JSON.stringify(message));

        await new Promise(async resolve => {
            const timeoutId = setTimeout(() => {
                this.setPlayerStale(`Send: Response not received to message ${JSON.stringify(message)}`);
            }, 5 * 1000);

            this.pendingRequests.set(messageId, { message, resolve, timeoutId });
        });
    }

    async sendCore(rawPayload) {
        await this.ensureUnstale();

        if (this.connectionState === PlayerConnectionState.HEALTHY) {
            this.ws.send(rawPayload);
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

    onStaleFor(seconds, func) {
        this.onStaleTime = seconds;
        this.onStaleFunc = func;
    }

    onConnect(func) {
        if (typeof func !== 'function') {
            throw new Error("Expected type function");
        }
        this.onConnectFunc = func;
    }

    onDisconnect(func) {
        if (typeof func !== 'function') {
            throw new Error("Expected type function");
        }
        this.onDisconnectFunc = () => {
            clearTimeout(this.onDisconnectTimeoutId);

            this.onDisconnectTimeoutId = setTimeout(async () => {
                await func();
                this.onDisconnectTimeoutId = null;
            }, 4 * 1000);
        };
    }

    registerListeners() {
        this.ws.on('message', async (message) => await this.handleMessage(message));
        this.ws.on('close', (event) => this.handleClose(event));
        this.ws.on('error', (error) => this.handleError(error));
    }

    replaceSocket(ws) {
        console.log(`${this.player.username} replacing socket, connection state ` + this.connectionState);
        if (this.connectionState === PlayerConnectionState.HEALTHY) {
            this.pendingRequests.forEach(value => {
                const { timeoutId } = value;
                clearTimeout(timeoutId);
            });
        }
        
        if (this.connectionState === PlayerConnectionState.STALE || this.connectionState === PlayerConnectionState.HEALTHY) {
            this.pendingRequests.clear();
            this.ws.removeAllListeners();
            this.ws.close(1000, "Another connection took over the session");
        }

        console.log("Pending requests: ", this.pendingRequests.size);
        this.ws = ws;
        this.registerListeners();
    }
}