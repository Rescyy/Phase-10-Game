document.addEventListener('DOMContentLoaded', async () => {
    const lobby = document.getElementById('lobby');
    
    if (lobby === null) {
        console.error('lobby element missing');
        return;
    }

    let loading = false;
    let roomStateTimestamp = 0;

    const readyButton = document.getElementById('ready-button');
    const readyButtonMessage = document.getElementById('ready-button-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const leaveButton = document.getElementById('leave-button');
    const selfReadyIndicator = document.querySelector('[data-self-ready]');
    const playersList = document.getElementById('players-list');
    const lobbyDisconnected = document.getElementById('lobby-disconnected');
    const lobbyDisconnectedReason = document.getElementById('lobby-disconnected-reason');

    readyButton.addEventListener('click', handleReadyButton);
    leaveButton.addEventListener('click', handleLeaveButton);

    const playerRowTemplate = await readResource('/views/playerRow.html');

    const protocol = 'ws';
    const wsUrl = `${protocol}://${window.location.host}${window.location.pathname}`;
    const socket = new WebSocketWrapper(wsUrl);
    socket.listenMessage('roomState', handleRoomState);
    await socket.connect();

    socket.onFullCloseFunc = (reason) => {
        lobbyDisconnected.classList.remove('hidden');
        lobby.classList.add('hidden');
        if (reason) {
            lobbyDisconnectedReason.textContent = `Reason: ${reason}`;
        }
    };

    // await socket.sendMessage('getRoomState')
    //     .then(handleRoomState)
    //     .catch(catchError);

    async function handleReadyButton(e) {
        if (loading) {
            return;
        }
        loading = true;

        let selfReady;
        if (selfReadyIndicator.dataset.selfReady === 'true') {
            selfReady = false;
        } else if (selfReadyIndicator.dataset.selfReady === 'false') {
            selfReady = true;
        }
        
        hideElement(readyButtonMessage);
        showElement(loadingSpinner);

        await socket.sendMessage('ready', { ready: selfReady })
            .then(() => {
                selfReadyIndicator.dataset.selfReady = selfReady;
            })
            .catch(catchError)
            .finally(() => {
                showElement(readyButtonMessage);
                hideElement(loadingSpinner);
                loading = false;
            });
    }

    async function handleLeaveButton(e) {
        window.location.href = '/';
    }

    function handleRoomState(payload) {
        const { players, timestamp } = payload;
        if (timestamp < roomStateTimestamp) {
            return;
        }

        playersList.innerHTML = players
            .map(player => renderTemplate(playerRowTemplate, player))
            .join('\n');
    }

    function catchError(e) {
        console.error(e.message);
        if (e instanceof TimeoutError) {
            // handle timeout
        } else {
            // handle server error
        }
    }

    window.addEventListener('pagehide', async () => await socket.disconnect('User navigating away'));
});