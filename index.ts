import * as net from "net";
import { Socket } from "net";

import { port } from "./config";
import ChatRoom from "./ChatRoom";

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

  socket.on("data", function dataListener(data) {
    const message: string = data.toString("utf8");

    if (!roomName){
      roomName = message.trim();
      socket.write("Enter nickname >");
    } else if (!nickName){
      nickName = message;

      ChatRoom.start(roomName, socket, nickName);

      socket.removeListener("data", dataListener);
    }
  })
}
