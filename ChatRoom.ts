import { Socket } from "net";

type ConnectionMetaData = {
  nickName: string
}

type ChatCommand = () => string;

const addZeroPad = (a: number): string => a < 10 ? `0${a}` : a.toString();

export default class ChatRoom {
  private static readonly rooms: Map<string, ChatRoom> = new Map();

  private readonly name: string;
  private readonly connections: Map<Socket, ConnectionMetaData> = new Map();
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
  }

  public static start(roomName: string, firstConnection: Socket, nickName: string): void{
    const room: ChatRoom = ChatRoom.rooms.get(roomName) || ChatRoom.open(roomName);

    room.add(firstConnection, nickName);
  }

  private static open(name: string): ChatRoom{
    const room: ChatRoom = new ChatRoom(name);

    ChatRoom.rooms.set(name, room);
    return room;
  }

  public add(connection: Socket, nickName: string): void{
    this.connections.set(connection, { nickName });
    this.setListeners(connection);
    this.sendMessage(`%%${this.name}%%`, `User "${nickName}" connected`);
  }

  private setListeners(connection: Socket): void{
    connection.on("data", data => this.dataListener(data, connection));
    connection.on("end", () => this.endListener(connection));
  }

  private dataListener(data: Buffer, connection: Socket): void{
    const message: string = data.toString("utf8");
    const command: ChatCommand = this.commands.get(message);

    if(command){
      connection.write(command());
    } else {
      const { nickName } = this.connections.get(connection);

      this.sendMessage(nickName, data.toString("utf8"));
    }
  }

  private endListener(connection: Socket){
    const { nickName } = this.connections.get(connection);

    this.sendMessage(`%%${this.name}%%`, `User "${nickName}" disconnected`);
    this.connections.delete(connection);
    console.log({connection});

    if (!this.connections.size) ChatRoom.close(this.name);
  }

  private static close(roomName: string): void{
    this.rooms.delete(roomName);
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
    const current = new Date();

    return `${addZeroPad(current.getHours())}:${addZeroPad(current.getMinutes())}:${addZeroPad(current.getSeconds())}`;
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
