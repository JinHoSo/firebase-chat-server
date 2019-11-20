import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Room, RoomId, UserId } from '..'
import { updateRoomDocument } from '../lib/room'

type LeaveGroupRoomArguments = {
  roomId: RoomId
}

export const leaveGroupRoom = functions.https.onCall(async (data: LeaveGroupRoomArguments, context): Promise<true> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId
  const { roomId } = data

  const updatedRoom: Pick<Room, 'userIdArray' | 'unreadMessageCount'> = {
    unreadMessageCount: {
      [myUserId]: admin.firestore.FieldValue.delete()
    },
    userIdArray: admin.firestore.FieldValue.arrayRemove(myUserId)
  }

  await updateRoomDocument(roomId, updatedRoom)

  return true
})