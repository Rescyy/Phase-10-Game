document.addEventListener('DOMContentLoaded', async () => {
    const lobby = document.getElementById('lobby');
    
    if (lobby === null) {
        console.error('lobby element missing');
        return;
    }

    const readyButton = document.getElementById('ready-button');
    const readyButtonMessage = document.getElementById('ready-button-message');
    const loadingSpinner = document.getElementById('loading-spinner');

    if (readyButton === null) {
        console.error('ready button missing');
        return;
    }

    const selfReadyIndicator = document.querySelector('[data-self-ready]');

    const protocol = 'ws';

    const wsUrl = `${protocol}://${window.location.host}${window.location.pathname}`;
    
    const socket = new WebSocketWrapper(wsUrl);
    await socket.connect();

    readyButton.addEventListener('click', handleReadyButton);

    const sendReadyState = async (readyState) => {
        if (selfReadyIndicator.dataset.selfReady === readyState) {
            return;
        }

        await socket.sendMessage('ready', { ready: readyState })
            .then(() => {
                selfReadyIndicator.dataset.selfReady = readyState;
            })
            .catch((e) => {
                console.error(e.message);
                if (e instanceof TimeoutError) {
                    // handle timeout
                } else {
                    // handle server error
                }
            })
            .finally(() => {
                showElement(readyButtonMessage);
                hideElement(loadingSpinner);
                loading = false;
            });
    };

    let loading = false;

    async function handleReadyButton(e) {
        if (loading) {
            return;
        }

        let selfReady;
        if (selfReadyIndicator.dataset.selfReady === 'true') {
            selfReady = false;
        } else if (selfReadyIndicator.dataset.selfReady === 'false') {
            selfReady = true;
        }

        hideElement(readyButtonMessage);
        showElement(loadingSpinner);
        loading = true;

        sendReadyState(selfReady);
    }
});