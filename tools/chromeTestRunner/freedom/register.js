window.freedomcfg = function(register) {
  register("core.storage", Storage_chromeStorageLocal);
  register("core.sctp-peerconnection", SctpPeerConnection);
};
