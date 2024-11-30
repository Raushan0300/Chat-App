// call.tsx

import React, { useEffect, useRef, useState } from 'react';
import socket from '@/socket'; // Adjust the import path according to your project structure
import { Button } from '@/components/ui/button';
import CallEndIcon from '@mui/icons-material/CallEnd';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';

interface VideoCallProps {
  socketId: string;
  onCallEnd: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ socketId, onCallEnd }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    startCall();

    return () => {
      cleanup();
    };
  }, [socketId]);

  const startCall = async () => {
    try {
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create RTCPeerConnection
      createPeerConnection();

      if (peerConnection.current) {
        // Add local stream tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
        });
      }

      if (socketId) {
        // Create offer
        const offer = await peerConnection.current?.createOffer();
        if (offer) {
          await peerConnection.current?.setLocalDescription(offer);
          // Send offer to remote peer via signaling server
          socket.emit('user:call', { to: socketId, offer });
        }
      }

      // Listen for ICE candidates
      peerConnection.current?.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to: socketId, candidate: event.candidate });
        }
      });

    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const createPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // Use STUN server
      ],
    });

    // Handle remote stream
    peerConnection.current.addEventListener('track', (event) => {
      console.log('Remote track received:', event.streams);
      if (remoteVideoRef.current) {
        if (remoteVideoRef.current.srcObject !== event.streams[0]) {
          setRemoteStream(event.streams[0]);
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    });
  };

  const handleIncomingCall = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
    try {
      if (!peerConnection.current) {
        createPeerConnection();
      }

      // Add local stream tracks to peer connection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, localStream);
        });
      }

      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await peerConnection.current?.createAnswer();
      if (answer) {
        await peerConnection.current?.setLocalDescription(answer);
        // Send answer back to caller via signaling server
        socket.emit('accept:call', { to: from, answer });
      }

      // Listen for ICE candidates
      peerConnection.current?.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', { to: from, candidate: event.candidate });
        }
      });

    } catch (error) {
      console.error('Error handling incoming call:', error);
    }
  };

  useEffect(() => {
    socket.on('incoming:call', handleIncomingCall);

    socket.on('call:accepted', async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        await peerConnection.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding received ICE candidate', error);
      }
    });

    socket.on('call:ended', () => {
      endCall();
    });

    return () => {
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted');
      socket.off('ice-candidate');
      socket.off('call:ended');
    };
  }, []);

  const cleanup = () => {
    console.log('Cleaning up');
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  };

  const endCall = () => {
    console.log('Ending call');
    cleanup();
    socket.emit('call:end', { to: socketId });
    onCallEnd();
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks()[0].enabled = !isVideoEnabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const startScreenShare = async () => {
    if (!localStream) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      // Replace video track in peer connection
      const sender = peerConnection.current?.getSenders().find((s) => s.track?.kind === 'video');
      sender?.replaceTrack(screenTrack);

      screenTrack.onended = () => {
        stopScreenShare();
      };

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current && localStream) {
      const sender = peerConnection.current?.getSenders().find((s) => s.track?.kind === 'video');
      sender?.replaceTrack(localStream.getVideoTracks()[0]);

      screenTrackRef.current.stop();
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      setIsScreenSharing(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-5">
      <div className="w-full px-5 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '85vh', backgroundColor: 'black' }}
        ></video>
        <div className="absolute bottom-5 right-10 h-48 w-48 z-10">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: '100%' }}
          ></video>
        </div>
      </div>
      <div className="flex gap-5 mt-5">
        <Button
          className="bg-red-500 px-4 py-2 rounded-full text-white"
          onClick={endCall}
        >
          <CallEndIcon />
        </Button>
        <Button
          className={`${isVideoEnabled ? 'bg-gray-500' : 'bg-red-500'} px-4 py-2 rounded-full text-white`}
          onClick={toggleVideo}
        >
          <VideocamOffIcon />
        </Button>
        <Button
          className={`${isAudioEnabled ? 'bg-gray-500' : 'bg-red-500'} px-4 py-2 rounded-full text-white`}
          onClick={toggleAudio}
        >
          <MicOffIcon />
        </Button>
        <Button
          className={`${isScreenSharing ? 'bg-red-500' : 'bg-gray-500'} px-4 py-2 rounded-full text-white`}
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
        >
          {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;