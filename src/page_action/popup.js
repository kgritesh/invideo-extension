function submit(event) {
  event.preventDefault();
  console.log("Reaching Here");
  const url = document.getElementById("urlInput").value;
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var tab = tabs[0];
    chrome.tabs.sendMessage(tab.id, {
      type: "changeBackgroundImage",
      payload: {
        url,
        thumbnailUrl: url,
      },
    });
    window.close();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("submit").onclick = submit;
});
