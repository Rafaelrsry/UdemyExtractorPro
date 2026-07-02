chrome.action.onClicked.addListener(async (tab) => {
  // Creamos una ventana emergente independiente con un tamaño ideal
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 500,
    height: 650,
    focused: true
  });
});