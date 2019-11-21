import * as functions from 'firebase-functions'

import { Room, RoomUser } from '..'
import { getUsersInRoom } from '../lib/user'

export type GetRoomUsersData = Pick<Room, 'roomId'>

export type GetRoomUsersResult = RoomUser[]

export const getRoomUsers = functions.https.onCall(async (roomData: GetRoomUsersData, context): Promise<GetRoomUsersResult> => {
  const { roomId } = roomData
  const roomUsers = await getUsersInRoom(roomId)
  return roomUsers
})