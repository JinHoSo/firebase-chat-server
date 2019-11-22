import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { GroupRoom, NoticeMessageType, Room, RoomId, User, UserId } from '..'
import { dateNowGenerator } from '../lib/generator/dateGenerator'
import { messageIdGenerator } from '../lib/generator/idGenerator'
import { createSystemMessageDocument, CreateSystemMessageDocumentData } from '../lib/message'
import { getRoomDocument, updateRoomDocument } from '../lib/room'
import { getUserDocument } from '../lib/user'

export type InviteGroupRoomData = {
  receiverUserId: UserId
  roomId: RoomId
}

export type InviteGroupRoomResult = GroupRoom

export const inviteGroupRoom = functions.https.onCall(async (roomData: InviteGroupRoomData, context): Promise<InviteGroupRoomResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const senderUserId = context.auth!.uid as UserId
  const { roomId, receiverUserId } = roomData

  if (senderUserId === receiverUserId) {
    throw new HttpsError('invalid-argument', 'sender and receiver are same')
  }

  const senderDoc = await getUserDocument(senderUserId)
  const senderNickname = (senderDoc.data() as User).nickname

  const receiverDoc = await getUserDocument(receiverUserId)
  const receiverNickname = (receiverDoc.data() as User).nickname

  const userLastSeenAt = dateNowGenerator()

  const updatedRoomData: Pick<Room, 'userIdArray' | 'userLastSeenAt'> = {
    userIdArray: admin.firestore.FieldValue.arrayUnion(receiverUserId),
    userLastSeenAt: {
      [receiverUserId]: userLastSeenAt
    }
  }

  await updateRoomDocument(roomId, updatedRoomData)

  //send system message this room
  const messageId = messageIdGenerator()

  const systemMessage: CreateSystemMessageDocumentData = {
    notice: {
      type: NoticeMessageType.JOIN_MEMBER,
      values: {
        senderNickname,
        receiverNickname
      }
    }
  }

  await createSystemMessageDocument(roomId, messageId, systemMessage)

  const updatedRoomDoc = await getRoomDocument(roomId)

  return updatedRoomDoc.data() as GroupRoom
})