import { FieldValue } from '@google-cloud/firestore'

//Event type
export enum EventType {
  CREATE_ROOM,
  JOIN_ROOM,
  LEAVE_ROOM,
  NEW_MESSAGE
}

//Online state
export enum OnlineState {
  ONLINE,
  OFFLINE
}

//Media type
export enum MediaType {
  IMAGE,
  VIDEO,
  VOICE
}

//Type for timestamp
export type Timestamp = number

//Type for user id
export type UserId = string

//Type for Room id
export type RoomId = string

//Type for message id
export type MessageId = string

//Type for Uri
export type Uri = string

//It is used for user presence on Realtime Database
export type UserOnlineStatus = {
  state: OnlineState
  joinedRoomId: RoomId
  lastSeenAt: Timestamp
}

//User type
export type User = {
  userId: UserId
  phoneNumber: string
  nickname: string
  locale: string
  avatar?: Uri
  pushToken?: string
  registeredAt: Timestamp
  updatedAt?: Timestamp
  leftAt?: Timestamp
  lastSeenAt?: Timestamp
}

//User type in a room
export type RoomUser = {
  userId: UserId
  nickname: string
  avatar?: Uri
}

//Last message type in a room
export type RoomLastMessage = {
  message: string
  sendAt: Timestamp
  userId: UserId
}

//Room type
export interface GroupRoom {
  name?: string
  roomId: RoomId
  createdAt: Timestamp
  updatedAt: Timestamp
  deletedAt?: Timestamp
  usersLastSeenAt: { [key: string]: Timestamp | FieldValue }
  lastMessage?: RoomLastMessage
  userIdArray: UserId[] | FieldValue
}

export interface PrivateRoom extends GroupRoom {
  userIdMap: { [key: string]: boolean | FieldValue }
}

export type Room = PrivateRoom | GroupRoom

//Media type in message
export type MessageMedia = {
  type: MediaType
  uri: Uri
}

//Message type
export type Message = {
  requestedId: MessageId
  messageId: MessageId
  replyMessageId?: MessageId
  roomId: RoomId
  senderUserId: UserId
  receiverUserId?: UserId
  text?: string
  media?: MessageMedia
  createdAt: Timestamp
  updatedAt?: Timestamp
  deletedAt?: Timestamp
}

export { registerUser } from './user/registerUser'
export { modifyUser } from './user/modifyUser'
export { leaveUser } from './user/leaveUser'
export { getMyProfile, getUserProfile } from './user/getUser'
export { createPrivateRoom, createGroupRoom } from './room/createRoom'
export { getRoom, getRooms, getRoomsAfterRoomId, getRoomsAfterUpdatedAt } from './room/getRoom'
export { joinRoom } from './room/joinRoom'
export { leaveGroupRoom as leaveRoom } from './room/leaveRoom'
export { inviteGroupRoom } from './room/inviteRoom'
export { getRoomUsers } from './room/roomUser'
export { sendMessage } from './message/sendMessage'
export { deleteMessage } from './message/deleteMessage'