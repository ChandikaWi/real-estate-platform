import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';
const socket = io(URL, {
  autoConnect: false // Manually connect when a user logs in
});

export default socket;