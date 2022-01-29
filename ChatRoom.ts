import { Socket } from "net";

export default class ChatRoom {
  private static readonly rooms: Map<string, ChatRoom> = new Map();
  public readonly name: string;
  private connections: Map<Socket, ConnectionMetaData> = new Map();
  private readonly messages: string[] = [];
  private readonly commands: Map<string, ChatCommand> = new Map([
    [
      "/history",
      this.getHistory.bind(this)
    ],
    [
      "/users",
      this.getNickNames.bind(this)
    ]
  ])

  private constructor(name: string){
    this.name = name;
    this.sendMessage(`%%${this.name}%%`, `room "${this.name}" created`);
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
    const message: string = data.toString("utf8");
    const command = this.commands.get(message);

    if(command){
      connection.write(command());
    } else {
      const { nickName } = this.connections.get(connection);
      this.sendMessage(nickName, data.toString());
    }
  }

  private getHistory(): string{
    const TITLE = "\n ----- HISTORY -----\n";
    return `${TITLE}${this.messages.join("\n")}${TITLE}`;
  }

  private getNickNames(): string{
    const TITLE = "\n ----- USERS -----\n";
    const nickNames = Array
      .from(this.connections.values())
      .map(({nickName}) => nickName);

    return `${TITLE}${nickNames.join("\n")}${TITLE}`;
  }
}

type ConnectionMetaData = {
  nickName: string
}

type ChatCommand = () => string;
