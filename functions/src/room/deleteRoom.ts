import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Room, UserId } from '..'
import { updateRoomDocument } from '../lib/room'

export type DeleteGroupRoomData = Pick<Room, 'roomId'>

export type DeleteGroupRoomResult = true

export const deleteGroupRoom = functions.https.onCall(async (roomData: DeleteGroupRoomData, context): Promise<DeleteGroupRoomResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId
  const { roomId } = roomData

  const updatedRoom: Pick<Room, 'userIdArray' | 'usersLastSeenAt'> = {
    usersLastSeenAt: {
      [myUserId]: admin.firestore.FieldValue.delete()
    },
    userIdArray: admin.firestore.FieldValue.arrayRemove(myUserId)
  }

  await updateRoomDocument(roomId, updatedRoom)

  return true
})