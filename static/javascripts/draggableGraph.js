let isDragging = false;
let startX, startY;

const graphContainer = document.getElementById('graph-container');

graphContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - graphContainer.offsetLeft;
    startY = e.clientY - graphContainer.offsetTop;
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const newX = e.clientX - startX;
    const newY = e.clientY - startY;

    graphContainer.style.left = `${newX}px`;
    graphContainer.style.top = `${newY}px`;
});