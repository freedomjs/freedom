fdom.apis.set("core.view", {
  show: {type: "method", value: ["object"]},
  close: {type: "method", value: []},
  postMessage: {type: "method", value: ["object"]},

  message: {type: "event", value: ["object"]},
  onClose: {type: "event", value: []}
});
