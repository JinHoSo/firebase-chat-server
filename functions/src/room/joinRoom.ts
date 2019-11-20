import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Room, RoomId, UserId } from '..'
import { database } from '../lib/firebase'
import { updateRoomDocument } from '../lib/room'

type JoinRoomArguments = {
  roomId: RoomId
}

export const joinRoom = functions.https.onCall(async (roomData: JoinRoomArguments, context): Promise<true> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId

  const { roomId } = roomData

  const joinedRoomData: Pick<Room, 'unreadMessageCount'> = {
    unreadMessageCount: {
      [myUserId]: 0,
    },
  }

  await updateRoomDocument(roomId, joinedRoomData)
  // const database = admin.database()
  await database.ref('/status/' + myUserId).update({ joinedRoom: roomId })

  return true
})