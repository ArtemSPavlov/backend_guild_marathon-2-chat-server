import * as net from "net";

import { port } from "./config";

const server = net.createServer((socket) => {
  socket.write('hello!');
  socket.end('goodbye\n');
}).on('error', (err) => {
  console.log(err);
  throw err;
});

server.listen(port, () => {
  console.log('opened server on', server.address());
});
