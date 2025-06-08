import { io } from 'socket.io-client';

export const socket = io('https://suddocs.uz', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
});