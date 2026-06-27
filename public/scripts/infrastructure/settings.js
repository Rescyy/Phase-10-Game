export const settings = {
    x: 600,
    y: 600,
    scale: 1,
    cards: 10,
};

(function renderSettings() {
    const settingsDiv = document.getElementById("settings");
    if (!settingsDiv) return;
    for (const [key, value] of Object.entries(settings)) {
        const settingNode = document.createElement('div');
        const settingName = document.createElement('span');
        settingName.textContent = key;
        const input = document.createElement('input');
        const inputId = `setting_${key}`;
        input.value = value;
        input.id = inputId;
        if (typeof (value) === 'number') {
            input.setAttribute('type', 'number');
            input.addEventListener('change', e => {
                settings[key] = Number(input.value);
            });
        } else if (typeof (value) === 'string') {
            input.setAttribute('type', 'string');
            input.addEventListener('change', e => {
                settings[key] = input.value;
            });
        }
        settingNode.appendChild(settingName);
        settingNode.appendChild(input);
        settingsDiv.appendChild(settingNode);
    }
})();

