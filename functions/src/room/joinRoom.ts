import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Room, UserId } from '..'
import { database } from '../lib/firebase'
import { dateNowGenerator } from '../lib/generator/dateGenerator'
import { updateRoomDocument } from '../lib/room'

export type JoinRoomData = Pick<Room, 'roomId'>

export type JoinRoomResult = true

export const joinRoom = functions.https.onCall(async (roomData: JoinRoomData, context): Promise<JoinRoomResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId

  const { roomId } = roomData

  const userLastSeenAt = dateNowGenerator()

  const joinedRoomData: Pick<Room, 'usersLastSeenAt'> = {
    usersLastSeenAt: {
      [myUserId]: userLastSeenAt,
    },
  }

  await updateRoomDocument(roomId, joinedRoomData)
  // const database = admin.database()
  await database.ref('/status/' + myUserId).update({ joinedRoom: roomId })

  return true
})