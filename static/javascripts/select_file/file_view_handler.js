export function addFileView(file) {
    // Make a file-view
    const fileView = document.createElement('div');
    fileView.classList.add('file-view');

    // File img and file name
    const fileDataWrapper = document.createElement('div');
    fileDataWrapper.classList.add('data-wrapper');

    // Buttons
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.classList.add('buttons-wrapper');

    fileView.appendChild(fileDataWrapper);
    fileView.appendChild(buttonsWrapper);


    // img
    const fileImg = document.createElement('img');
    fileImg.setAttribute('src', fetch('/resources/images/excel_logo_closed.svg'));
    fileImg.setAttribute('alt', "Excel icon closed");

    // Text container to bound text to a certain size
    const textContainer = document.createElement('div');
    textContainer.classList.add('text-container');

    fileDataWrapper.appendChild(fileImg);
    fileDataWrapper.appendChild(textContainer);


    // file name
    const fileParagraph = document.createElement('p');
    fileParagraph.textContent = file.name;

    // Tool tip when hovering
    const tooltipElement = document.createElement('span');
    tooltipElement.textContent = file.name;

    textContainer.appendChild(fileParagraph);
    textContainer.appendChild(tooltipElement);




}