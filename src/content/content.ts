import * as $ from "jquery";

let currentVideo = null;
let componentMaps = {};
const videoDivID = `video-${new Date().getTime()}`;
const authToken = localStorage.getItem("authToken");

const generateBody = (
  videoId,
  blockIndex,
  componentIndex,
  url,
  thumbnailUrl
) => ({
  master_video_id: `${videoId}`,
  diff: [
    {
      op: "replace",
      path: `/16:9/blocks/${blockIndex}/components/${componentIndex}/components/0/media_properties/thumbnail_url`,
      value: `${thumbnailUrl}`,
    },
    {
      op: "replace",
      path: `/16:9/blocks/${blockIndex}/components/${componentIndex}/components/0/media_properties/image_link`,
      value: `${url}`,
    },
    {
      op: "replace",
      path: `/16:9/blocks/${blockIndex}/components/${componentIndex}/components/0/media_properties/url`,
      value: `${url}`,
    },
    {
      op: "replace",
      path: `/16:9/blocks/${blockIndex}/components/${componentIndex}/components/0/thumbnail_url`,
      value: `${thumbnailUrl}`,
    },
    {
      op: "replace",
      path: `/16:9/blocks/${blockIndex}/components/${componentIndex}/components/0/url`,
      value: `${url}`,
    },
    {
      op: "replace",
      path: `/16:9/blocks/${blockIndex}/thumbnail_url`,
      value: `${thumbnailUrl}`,
    },
  ],
});

const updateComponentMap = (video) => {
  video["16:9"].blocks.forEach((block, blockIndex) => {
    block.components.forEach((comp, compIndex) => {
      componentMaps[comp.id] = {
        compIndex,
        blockIndex,
        ...comp,
      };
    });
  });
};

const detectActiveLayer = () => {
  const activeElements = $(".click-element");
  if (activeElements.length === 0) {
    return null;
  }
  const layerID = activeElements[0].id;
  const component = componentMaps[layerID];
  console.log("Active component", component);
  return component;
};

const changeBackgroundImage = (payload) => {
  const activeComponent = detectActiveLayer();
  if (!activeComponent) {
    alert("Please select an active layer to replace image");
    return;
  }
  if (activeComponent.components[0].type !== "image") {
    alert("Active layer must be of type image");
    return;
  }
  console.log("Change active Component");
  const img = $(".click-element img");
  img.first().attr("src", payload.url);
  saveUpdatedVideo(activeComponent, payload);
};

const saveUpdatedVideo = (component, payload) => {
  const body = generateBody(
    currentVideo.master_video_id,
    component.blockIndex,
    component.compIndex,
    payload.url,
    payload.thumbnailUrl
  );
  $.ajax({
    type: "POST",
    data: JSON.stringify(body),
    url: "https://beta-backend.invideo.io/v3/sync_with_diff",
    dataType: "json",
    contentType: "application/json",
    headers: {
      authtoken: authToken,
    },
    success: (result) => {
      console.info("success", result);
      location.reload();
    },
    error: (xhr, status, error) => {
      console.error(xhr, status, error);
    },
  });
};

const ajaxListener = `function() {
  console.info("Inside Script");

  const open = window.XMLHttpRequest.prototype.open,
  send = window.XMLHttpRequest.prototype.send;
  ///  onload = window.XMLHttpRequest.prototype.onerror;
  $("body").append('<div id="${videoDivID}" data-video=""></div>');
  $("#${videoDivID}").hide();

  function openReplacement(method, url, headers) {
    this._url = new URL(url);
    this._headers = headers;
    console.l
    return open.apply(this, arguments);
  }

  function sendReplacement(data) {
    if (!this._url.pathname.endsWith("get_master_json_by_id")){
      return send.apply(this, arguments);
    }

    if(this.onreadystatechange) {
      this._onreadystatechange = this.onreadystatechange;
    }
    this.onreadystatechange = onReadyStateChangeReplacement;
    return send.apply(this, arguments);
  }

  function onReadyStateChangeReplacement() {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      $("#${videoDivID}").attr("data-video", this.responseText);
      console.log("Video Updated");
    }

    if(this._onreadystatechange) {
      return this._onreadystatechange.apply(this, arguments);
    }

  }

  window.XMLHttpRequest.prototype.open = openReplacement;
  window.XMLHttpRequest.prototype.send = sendReplacement;
}`;

var actualCode = "(" + ajaxListener + ")();";
var script = document.createElement("script");
script.textContent = actualCode;
(document.head || document.documentElement).appendChild(script);
//script.remove();

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "changeBackgroundImage") {
    currentVideo = JSON.parse($(`#${videoDivID}`).attr("data-video"));
    updateComponentMap(currentVideo);
    console.log("Current Video", currentVideo, componentMaps);
    changeBackgroundImage(message.payload);
  }
});
