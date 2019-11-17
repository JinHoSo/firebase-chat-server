import * as functions from 'firebase-functions';

import { RoomId, RoomUser } from '..';
import { getUsersInRoom } from '../lib/user';

type GetRoomUserAruments = {
  roomId:RoomId
}

export const getRoomUsers = functions.https.onCall(async (roomData: GetRoomUserAruments, context): Promise<RoomUser[]> => {
  const {roomId} = roomData
  const roomUsers = await getUsersInRoom(roomId)
  return roomUsers
})