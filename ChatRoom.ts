import { Socket } from "net";

export default class ChatRoom {
  private static readonly rooms: Map<string, ChatRoom> = new Map<string, ChatRoom>();
  public readonly name: string;
  private connections: Map<Socket, ConnectionMetaData> = new Map<Socket, ConnectionMetaData>();
  private readonly messages: string[] = [];
  private readonly commands: [] = []

  private constructor(name: string){
    this.name = name;
    this.sendMessage(`%%${this.name}%%`, `room "${this.name}" created`);
  }

  public static start(roomName: string, firstConnection: Socket, nickName: string): void{
    const room = ChatRoom.rooms.get(roomName) || ChatRoom.create(roomName);

    room.push(firstConnection, nickName);
  }

  private static create(name: string): ChatRoom{
    const room = new ChatRoom(name);
    ChatRoom.rooms.set(name, room);
    return room;
  }

  public push(connection: Socket, nickName: string): void{
    this.connections.set(connection, {nickName});
    this.setListeners(connection);
    this.sendMessage(`%%${this.name}%%`, `user "${nickName}" connected`);
  }

  private setListeners(connection: Socket): void{
    connection.on("data", data => this.dataListener(data, connection));
  }

  private dataListener(data: Buffer, connection: Socket): void{
    const { nickName } = this.connections.get(connection);
    this.sendMessage(nickName, data.toString());
  }

  private sendMessage(author: string, text: string): string{
    const time = ChatRoom.getCurrentTime();
    const message = `${author} [${time}]: ${text}`;

    const sockets = Array.from(this.connections.keys());
    sockets.forEach(socket => socket.write(message));

    this.messages.push(message);
    return message;
  }

  private static getCurrentTime(): string{
    const currentDate = new Date();
    return `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;
  }
}

type ConnectionMetaData = {
  nickName: string
}
