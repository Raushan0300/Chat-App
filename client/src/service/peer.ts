// peer.ts

import SimplePeer from 'simple-peer';

export function createPeer(initiator: boolean, stream: MediaStream) {
  const peer = new SimplePeer({
    initiator,
    trickle: false,
    stream, // Pass the local media stream
  });

  return peer;
}