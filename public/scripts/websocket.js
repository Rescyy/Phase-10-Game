class TimeoutError extends Error {
    constructor(...args) {
        super(args);
    }
}

class WebSocketWrapper {
    constructor(url) {
        this.url = url;
        this.socket = null;
        this.pendingRequests = new Map();
        this.messageListeners = new Map();
        this.shouldRetry = true;
        this.closeCode = null;
        this.retries = 0;
        this.maxRetries = 5;
        this.reconnectPromise = null;
        this.onFullCloseFunc = null;
    }

    async connect() {
        this.openSocket();
        await this.ensureConnection();
    }

    async disconnect(reason) {
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
            await new Promise(resolve => {
                this.socket.addEventListener('close', resolve);
                this.socket.close(1000, reason);
            })
        }
    }

    async sendMessage(name, payload) {
        const messageId = crypto.randomUUID();

        const message = {
            id: messageId,
            direction: 'request',
            name,
            payload,
        };

        return new Promise((resolve, reject) => {
            this.sendCore(JSON.stringify(message)).catch(reject);
            
            const timeoutId = setTimeout(() => {
                reject(new TimeoutError("Request timed out"));
            }, 30 * 1000);
            
            this.pendingRequests.set(messageId, { 
                message,
                resolve,
                reject,
                timeoutId
            });
        });
    }

    async waitConnect() {
        let openOnceListener;
        let errorOnceListener;

        await new Promise((resolve) => {
            openOnceListener = this.socket.addEventListener('open', resolve);
            errorOnceListener = this.socket.addEventListener('error', resolve);    
        });

        this.socket.removeEventListener('open', openOnceListener);
        this.socket.removeEventListener('error', errorOnceListener);

        if (this.socket.readyState === WebSocket.OPEN) {
            this.listenForReconnection();
        }
    }

    async ensureConnection() {
        if (!this.shouldRetry) {
            throw new Error("Connection should not be retried");
        }

        if (this.reconnectPromise) {
            const refReconnectPromise = this.reconnectPromise;
            await refReconnectPromise;
            return;
        }

        if (this.socket.readyState === WebSocket.CONNECTING) {
            await this.waitConnect();
        }
        
        if (this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        this.reconnectPromise = new Promise(async (resolve) => {
            while (true) {
                if (this.retries === this.maxRetries) {
                    throw new TimeoutError("Maximum amount of retries reached, timing out");
                }
                console.log("Reconnecting WebSocket try: ", this.retries + 1);
                this.openSocket();

                if (this.socket.readyState === WebSocket.CONNECTING) {
                    await this.waitConnect();
                } else {
                    throw new Error("Cannot wait to connect, expected CONNECTING socket ready state, instead got: ", this.socket.readyState);
                }
                
                if (this.socket.readyState === WebSocket.OPEN) {
                    resolve();
                    return;
                }

                const waitTime = (Math.min(this.retries, this.maxRetries) + 1) * 2000;
                await new Promise((resolve) => setTimeout(resolve, waitTime));
                this.retries++;
            }
        });

        await this.reconnectPromise;
        
        this.retries = 0;
        this.reconnectPromise = null;
    }

    listenForReconnection() {
        function tryReconnect() {
            if (this.shouldRetry) {
                this.ensureConnection();
            }
        }

        document.addEventListener('close', tryReconnect);
        document.addEventListener('error', tryReconnect);
    }

    openSocket() {
        this.socket = new WebSocket(this.url);
        this.socket.addEventListener('message', (e) => this.handleMessage(e));
        this.socket.addEventListener('close', (e) => this.handleClose(e));
        this.socket.addEventListener('error', (e) => this.handleError(e));
        this.listenMessage('ping', () => 'pong');
        this.closeCode = null;
    }

    handleMessage(e) {
        const message = JSON.parse(e.data);

        switch (message.direction) {
            case 'response':
                this.handleResponse(message);
                break;
            case 'request':
                this.handleRequest(message);
                break;
            default:
                throw new Error("Undefined message direction received: ", message.direction);
        }
    }

    handleClose(e) {
        const code = e.code;
        console.log("Connection closed: ", code);

        switch (code) {
            case 1000:
            case 1002:
            case 1003:
            case 1007:
            case 1008:
            case 1009:
            case 1015:
                this.shouldRetry = false;
                this.closeCode = code;
                console.log("Connection closed, stopped retrying");
                this?.onFullCloseFunc(e.reason);
                break;
        }
    }

    handleError(e) {
        console.error("Websocket error:", e.data);
    }

    async sendCore(payload) {
        await this.ensureConnection();
        this.socket.send(payload);
    }

    listenMessage(name, func) {
        if (typeof func !== 'function') {
            throw new Error("Expected func to be function");
        }
        this.messageListeners.set(name, func);
    }

    handleResponse(message) {
        if (this.pendingRequests.has(message.id)) {
            const {
                resolve,
                timeoutId,
            } = this.pendingRequests.get(message.id);

            clearTimeout(timeoutId);
            resolve(message.payload);

            this.pendingRequests.delete(message.id);
        } else {
            throw new Error("Received stray response: ", message);
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
            throw new Error("Received unknown message: ", message);
        }
    }
}