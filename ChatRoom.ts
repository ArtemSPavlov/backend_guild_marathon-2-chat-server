import { Socket } from "net";

type UserMetaData = {
  nickName: string
}

type ChatCommand = () => string;

const addZeroPad = (a: number): string => a < 10 ? `0${a}` : a.toString();

export default class ChatRoom {
  private static readonly rooms: Map<string, ChatRoom> = new Map();

  private readonly name: string;
  private readonly users: Map<Socket, UserMetaData> = new Map();
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

  public static start(roomName: string, firstUser: Socket, nickName: string): void{
    const room: ChatRoom = ChatRoom.rooms.get(roomName) || ChatRoom.open(roomName);

    room.addUser(firstUser, nickName);
  }

  private static open(name: string): ChatRoom{
    const room: ChatRoom = new ChatRoom(name);

    ChatRoom.rooms.set(name, room);
    return room;
  }

  public addUser(user: Socket, nickName: string): void{
    this.users.set(user, { nickName });
    this.setListeners(user);
    this.sendMessage(`%%${this.name}%%`, `User "${nickName}" connected`);
  }

  private setListeners(user: Socket): void{
    user.on("data", data => this.dataListener(data, user));
    user.on("end", () => this.endListener(user));
    user.on("error", () => this.endListener(user));
  }

  private dataListener(data: Buffer, user: Socket): void{
    const message: string = data.toString("utf8");
    const command: ChatCommand = this.commands.get(message);

    if(command){
      user.write(command());
    } else {
      const { nickName } = this.users.get(user);

      this.sendMessage(nickName, data.toString("utf8"));
    }
  }

  private endListener(user: Socket){
    const { nickName } = this.users.get(user);

    user.removeAllListeners();
    this.sendMessage(`%%${this.name}%%`, `User "${nickName}" disconnected`);
    this.users.delete(user);

    if (!this.users.size) ChatRoom.close(this.name);
  }

  private static close(roomName: string): void{
    this.rooms.delete(roomName);
  }

  private sendMessage(author: string, text: string): string{
    const time = ChatRoom.getCurrentTime();
    const message = `[${time}] ${author}: ${text}`;
    const sockets = Array.from(this.users.keys());

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
      .from(this.users.values())
      .map(({nickName}) => nickName);

    return `${TITLE}${nickNames.join("\n")}${TITLE}`;
  }
}
