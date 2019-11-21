import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { NoticeMessageType, Room, User, UserId } from '..'
import { messageIdGenerator } from '../lib/generator/idGenerator'
import { createSystemMessageDocument, CreateSystemMessageDocumentData } from '../lib/message'
import { updateRoomDocument } from '../lib/room'
import { getUserDocument } from '../lib/user'

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

  const user = await getUserDocument(myUserId)
  const userNickname = (user.data() as User).nickname
  
  //send system message this room
  const messageId = messageIdGenerator()

  const systemMessage: CreateSystemMessageDocumentData = {
    notice: {
      type: NoticeMessageType.LEFT_MEMBER,
      values: {
        userNickname
      }
    }
  }

  await createSystemMessageDocument(roomId, messageId, systemMessage)

  return true
})