import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

import { Room, RoomId, UserId } from '..';
import { getRoomDocument, updateRoomDocument } from '../lib/room';

type LeaveGroupRoomArguments = {
  roomId: RoomId
}

export const leaveGroupRoom = functions.https.onCall(async (data: LeaveGroupRoomArguments, context): Promise<true> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const myUserId = context.auth!.uid as UserId
  const { roomId } = data

  const roomDoc = await getRoomDocument(roomId)

  if (!roomDoc.exists) {
    throw `room(${roomId}) is not exists`
  }

  const updatedRoom: Pick<Room, 'userIdArray' | 'unreadMessageCount'> = {
    unreadMessageCount: {
      [myUserId]: admin.firestore.FieldValue.delete()
    },
    userIdArray: admin.firestore.FieldValue.arrayRemove(myUserId)
  }

  await updateRoomDocument(roomId, updatedRoom)

  return true
})