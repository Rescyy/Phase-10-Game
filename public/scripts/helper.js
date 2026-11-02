function showElement(element) {
    element?.classList.remove('hidden');
}

function hideElement(element) {
    element?.classList.add('hidden');
}

function debounceAsync(func, delay) {
    let timerId;

    return function (...args) {
        clearTimeout(timerId);

        timerId = setTimeout(async () => {
            await func.apply(this, args);
        }, delay);
    }
}

async function readResource(url) {
    return await fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error status ${response.status}`);
            }
            return response.text();
        })
        .catch((error) => {
            console.error("fetch error: ", error.message);
        });
} 

function renderTemplate(template, model) {
    return template.replace(
            /\{\{\s*([\w.]+)\s*\}\}/g,
            (_, key) => {
                const value = key
                    .split(".")
                    .reduce((obj, part) => obj?.[part], model);

                if (typeof value === 'boolean') {
                    return value ? 'true' : 'false';
                }
                return value ?? "";
            }
        );
}

// function render