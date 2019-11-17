import * as functions from 'firebase-functions';

import { Room, RoomId, UserId } from '..';
import { database } from '../lib/constration';
import { getRoomDocument, updateRoomDocument } from '../lib/room';

type JoinRoomArguments = {
  roomId: RoomId
}

export const joinRoom = functions.https.onCall(async (roomData: JoinRoomArguments, context): Promise<true> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const myUserId = context.auth!.uid as UserId

  const { roomId } = roomData

  const roomDoc = await getRoomDocument(roomId)

  if (roomDoc.exists) {
    const joinedRoomData: Pick<Room, 'unreadMessageCount'> = {
      unreadMessageCount: {
        [myUserId]: 0,
      },
    }

    await updateRoomDocument(roomId, joinedRoomData)
    // const database = admin.database()
    await database.ref('/status/' + myUserId).update({ joinedRoom: roomId })

    return true
  }
  else {
    throw `room(${roomId}) is not exists`
  }
})