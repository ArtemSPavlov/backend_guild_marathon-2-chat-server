import * as net from "net";
import { Socket } from "net";

import { port } from "./config";

const server = net
  .createServer(connectionListener)
  .listen(port, () => {
    console.log("opened server on", server.address());
  })
  .on("error", (err) => {
    console.log(err);
    throw err;
  });

function connectionListener(socket: Socket): void {
  socket.write("Enter chat room name >");

  let roomName: string;
  let nickName: string;

  socket.on("data", data => {
    const message: string = data.toString("utf8");

    if (!roomName){
      roomName = message;
      socket.write("Enter nickname >");
    } else {
      nickName = message;

      console.log(`Connect to room "${roomName}" with nickname "${nickName}"`);

      server.removeListener("connection", connectionListener);
    }
  })
}
