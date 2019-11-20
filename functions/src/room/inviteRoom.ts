import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { GroupRoom, Room, RoomId, UserId } from '..'
import { getRoomDocument, updateRoomDocument } from '../lib/room'
import { isExistsUser } from '../lib/user'

type InviteRoomArguments = {
  receiverUserId: UserId
  roomId: RoomId
}

export const inviteGroupRoom = functions.https.onCall(async (roomData: InviteRoomArguments, context): Promise<GroupRoom> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const senderUserId = context.auth!.uid as UserId
  const { receiverUserId } = roomData
  const { roomId } = roomData

  if (senderUserId === receiverUserId) {
    throw new HttpsError('invalid-argument', 'sender and receiver are same')
  }

  const isSenderExists = isExistsUser(senderUserId)
  if (!isSenderExists) {
    throw new HttpsError('not-found', `sender(${senderUserId}) is not exists`, {
      userId: senderUserId
    })
  }

  const isReceiverExists = isExistsUser(receiverUserId)
  if (!isReceiverExists) {
    throw new HttpsError('not-found', `receiver(${receiverUserId}) is not exists`, {
      userId: receiverUserId
    })
  }

  const updatedRoomData: Pick<Room, 'userIdArray' | 'unreadMessageCount'> = {
    userIdArray: admin.firestore.FieldValue.arrayUnion(receiverUserId),
    unreadMessageCount: {
      [receiverUserId]: 0
    }
  }

  await updateRoomDocument(roomId, updatedRoomData)

  const updatedRoomDoc = await getRoomDocument(roomId)

  return updatedRoomDoc.data() as GroupRoom
})