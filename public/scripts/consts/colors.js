export const CardColors = {
    RED: '#eb4034',
    GREEN: '#309a42',
    BLUE: '#0071cf',
    YELLOW: '#faee02',
    getAll() {
        return [this.RED, this.BLUE, this.GREEN, this.YELLOW];
    },
    validate(color) {
        return CardColors[color] || this.getAll().includes(color);
    },
};

export const HoverColors = {
    fill: "rgba(150,150,150,0.45)",
    stroke: "rgba(75,75,75,0.65)",
    lineWidth: 4,
}
