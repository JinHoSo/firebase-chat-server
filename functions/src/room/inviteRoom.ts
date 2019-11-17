import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { GroupRoom, Room, RoomId, UserId } from '..';
import { getRoomDocument, updateRoomDocument } from '../lib/room';
import { isExistsUser } from '../lib/user';

type InviteRoomArguments = {
  receiverUserId: UserId
  roomId: RoomId
}

export const inviteGroupRoom = functions.https.onCall(async (roomData: InviteRoomArguments, context): Promise<GroupRoom> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const senderUserId = context.auth!.uid as UserId
  const { receiverUserId } = roomData
  const { roomId } = roomData

  if (senderUserId === receiverUserId) {
    throw 'sender and receiver are same'
  }

  const isSenderExists = isExistsUser(senderUserId)
  if (!isSenderExists) {
    throw `sender(${senderUserId}) is not exists`
  }

  const isReceiverExists = isExistsUser(receiverUserId)
  if (!isReceiverExists) {
    throw `receiver(${receiverUserId}) is not exists`
  }

  const roomDoc = await getRoomDocument(roomId)

  if (!roomDoc.exists) {
    throw `room(${roomId}) is not exists`
  }

  const updatedRoomData: Pick<Room, 'userIdArray' | 'unreadMessageCount'> = {
    userIdArray: admin.firestore.FieldValue.arrayUnion(receiverUserId),
    unreadMessageCount: {
      [receiverUserId]: 0
    }
  }

  await updateRoomDocument(roomId, updatedRoomData)

  const updatedRoomDoc = await getRoomDocument(roomId)

  if (updatedRoomDoc.exists) {
    return updatedRoomDoc.data() as GroupRoom
  }
  else {
    throw `failed to get updated room(${roomId}) after updating the room`
  }
})