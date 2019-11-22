import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { GroupMessage, PrivateMessage, User, UserId } from '..'
import { roomCollection } from '../lib/firebase'
import { dateNowGenerator } from '../lib/generator/dateGenerator'
import { messageIdGenerator } from '../lib/generator/idGenerator'
import {
  createGroupMessageDocument,
  CreateGroupMessageDocumentData,
  createPrivateMessageDocument,
  CreatePrivateMessageDocumentData,
} from '../lib/message'
import { pushNotification } from '../lib/pushNotification'
import { getRoomData } from '../lib/room'
import { getUserData, getUserDocument } from '../lib/user'

export type SendPrivateMessageData = Omit<PrivateMessage, 'senderUserId' | 'messageId' | 'createdAt' | 'deletedAt'>
export type SendPrivateMessageResult = Pick<PrivateMessage, 'roomId' | 'requestedId' | 'messageId' | 'createdAt'>

export type SendGroupMessageData = Omit<GroupMessage, 'senderUserId' | 'messageId' | 'createdAt' | 'deletedAt'>
export type SendGroupMessageResult = Pick<GroupMessage, 'roomId' | 'requestedId' | 'messageId' | 'createdAt'>

export const sendPrivateMessage = functions.https.onCall(async (messageData: SendPrivateMessageData, context): Promise<SendPrivateMessageResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const {
    requestedId,
    roomId,
    text,
    media
  } = messageData

  const senderUserId: UserId = context.auth!.uid as UserId
  const messageId = messageIdGenerator()

  const newPrivateMessage: CreatePrivateMessageDocumentData = {
    requestedId,
    senderUserId,
    text,
    media
  }

  const writeResult = await createPrivateMessageDocument(roomId, messageId, newPrivateMessage)
  const createdAt = writeResult.writeTime.toMillis()

  roomCollection.doc(roomId).set({
    lastMessage: newPrivateMessage,
    updatedAt: createdAt,
  }, {
    merge: true
  })

  pushNotification(senderUserId, roomId, text, media)

  return {
    roomId,
    requestedId,
    messageId,
    createdAt
  }
})

export const sendGroupMessage = functions.https.onCall(async (messageData: SendGroupMessageData, context): Promise<SendGroupMessageResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const senderUserId: UserId = context.auth!.uid as UserId

  const {
    requestedId,
    roomId,
    receiverUserId,
    text,
    media
  } = messageData

  //check receiver user is online
  if (senderUserId === receiverUserId) {
    throw new HttpsError('invalid-argument', 'sender and receiver are same')
  }

  const senderDoc = await getUserDocument(senderUserId)
  const sender = senderDoc.data() as User

  const messageCreatedAt = dateNowGenerator()
  const messageId = messageIdGenerator()

  const newMessage: CreateGroupMessageDocumentData = {
    requestedId,
    senderUserId,
    receiverUserId,
    text,
    media
  }

  await createGroupMessageDocument(roomId, messageId, newMessage)

  await roomCollection.doc(roomId).set({
    lastMessage: newMessage,
    updatedAt: messageCreatedAt,
  }, {
    merge: true
  })

  pushNotification(senderUserId, roomId, text, media)
  
  return {
    roomId,
    requestedId,
    messageId,
    createdAt: messageCreatedAt
  }
})