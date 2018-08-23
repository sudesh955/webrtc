var mediaConstraints = {
  optional: [],
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  }
};

ejs.fileLoader = function (path) {
  return document.getElementById(path).textContent;
}

var socket, call = null;

function main() {
  socket = io();
  socket.on('online-clients', setOnlineClients);
  socket.on('add-online-client', addOnlineClient);
  socket.on('remove-online-client', removeOnlineClient);
  socket.on('got-call-offer', gotCallOffer);
  socket.on('got-call-answer', gotCallAnswer);
  socket.on('got-ice-candidate', gotIceCandidate);
}

function setOnlineClients(clients) {
  for (var i = clients.length - 1; i >= 0; i--) {
    addOnlineClient(clients[i]);
  }
}

function addOnlineClient(client) {
  var container = document.getElementById('clients');
  container.appendChild(document.createElement('div'));
  container.lastChild.innerHTML = client;
  container.lastChild.addEventListener('click', function () {
    startCall(client);
  });
}

function removeOnlineClient(client) {
  for (var el = document.getElementById('clients').firstChild; el !== null; el = el.nextSibling) {
    if (el.innerHTML === client) {
      el.remove();
      break;
    }
  }
}

function startCall(client) {
  if (call !== null) return;
  call = {
    client: client,
    pc: createRTCPeerConnection(),
  };
  call.pc.createOffer(localOfferCreated, onError, mediaConstraints);
  setLocalStreams();
}

function localOfferCreated(offer) {
  console.log('local offer created', offer);
  call.pc.setLocalDescription(offer, localDescriptionSet, onError);
}

function gotIceCandidate(client, candidate) {
  if (!call || call.client !== client) return;
  call.pc.addIceCandidate(candidate, addedIceCandidate, onError);
  console.log('received ice candidate', candidate);
}

function localDescriptionSet() {
  console.log('calling');
  socket.emit('send-event', call.client, 'got-call-offer', call.pc.localDescription); 
}

function gotCallOffer(client, offer) {
  if (call !== null) return;
  console.log('receiving call', offer);
  call = {
    client: client,
    pc: createRTCPeerConnection(),
  };
  call.pc.setRemoteDescription(new RTCSessionDescription(offer), createCallAnswer, onError);
}

function createCallAnswer() {
  console.log('preparing answer');
  call.pc.createAnswer(onAnswerCreated, onError);
}

function onAnswerCreated(answer) {
  console.log('prepared answer', answer);
  call.offer = answer;
  call.pc.setLocalDescription(answer, answerCall, onError);
}

function answerCall() {
  console.log('answering'); 
  socket.emit('send-event', call.client, 'got-call-answer', call.pc.localDescription);
}

function gotCallAnswer(client, answer) {
  console.log('got call answer', answer);
  call.pc.setRemoteDescription(new RTCSessionDescription(answer), callConnected, onError);
}

function callConnected() {
  console.log('call connected');
}

function onError() {
  console.log(error);
  alert('error');
}

function createRTCPeerConnection () {
  var pc = new RTCPeerConnection();
  pc.addEventListener('icecandidate', onIceCandidate);
  return pc;
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log('sending ice candidate', event.candidate);
    socket.emit('send-event', call.client, 'got-ice-candidate', event.candidate);
  }
}

function addedIceCandidate() {
  console.log('added icecandidate');
}

function setLocalStreams() {
  console.log(navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(gotLocalStreams, onError));
}

function gotLocalStreams(stream) {
  console.log(stream);
}