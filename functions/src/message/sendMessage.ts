import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Message, OnlineState, User, UserId, UserOnlineStatus, GroupMessage } from '..'
import { database, messaging, roomCollection } from '../lib/firebase'
import { dateNowGenerator } from '../lib/generator/dateGenerator'
import { messageIdGenerator } from '../lib/generator/idGenerator'
import { messageMediaToTextGenerator } from '../lib/generator/textGenerator'
import { createGroupMessageDocument, CreateGroupMessageDocumentData, createPrivateMessageDocument } from '../lib/message'
import { getUserDocument } from '../lib/user'
import { PrivateMessage } from '../index';

export type SendPrivateMessageData = Omit<PrivateMessage, 'senderUserId' | 'messageId' | 'createdAt' | 'deletedAt'>
export type SendPrivateMessageResult = Pick<PrivateMessage, 'roomId' | 'requestedId' | 'messageId' | 'createdAt'>

export type SendGroupMessageData = Omit<GroupMessage, 'senderUserId' | 'messageId' | 'createdAt' | 'deletedAt'>
export type SendGroupMessageResult = Pick<GroupMessage, 'roomId' | 'requestedId' | 'messageId' | 'createdAt'>

export const sendPrivateMessage = functions.https.onCall(async (messageData: SendPrivateMessageData, context): Promise<SendPrivateMessageResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const senderUserId: UserId = context.auth!.uid as UserId

  const {
    requestedId,
    roomId,
    text,
    media
  } = messageData

  const senderDoc = await getUserDocument(senderUserId)
  const sender = senderDoc.data() as User

  const messageCreatedAt = dateNowGenerator()
  const messageId = messageIdGenerator()

  const newMessage: CreateGroupMessageDocumentData = {
    requestedId,
    senderUserId,
    text,
    media
  }

  await createPrivateMessageDocument(roomId, messageId, newMessage)

  await roomCollection.doc(roomId).set({
    lastMessage: newMessage,
    updatedAt: messageCreatedAt,
  }, {
    merge: true
  })

  return {
    roomId,
    requestedId,
    messageId,
    createdAt: messageCreatedAt
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

  if (receiverUserId) {
    const receiverDoc = await getUserDocument(receiverUserId)
    const receiver = receiverDoc.data() as User

    const receiverStatusStore = database.ref('/status/' + receiverUserId)
    const receiverStatusSnapshot = await receiverStatusStore.once('value')
    const receiverStatue = receiverStatusSnapshot.val() as UserOnlineStatus
    const isReceiverOnline = receiverStatue && receiverStatue.state === OnlineState.ONLINE ? true : false
    // const isJoinedConversationNow = receiverStatue && receiverStatue.joinedRoomId ? receiverStatue.joinedRoomId === roomId : false

    //send push notification
    if (receiver.pushToken && !isReceiverOnline) {
      const payload = {
        notification: {
          title: sender.nickname,
          body: media ? messageMediaToTextGenerator(media, receiver.locale) : text,
          sound: 'default',
          badge: '1',
        },
        data: {
          roomId,
          senderUserId,
          senderUserNickname: sender.nickname,
        },
      }

      await messaging.sendToDevice(receiver.pushToken, payload)
    }
  }

  return {
    roomId,
    requestedId,
    messageId,
    createdAt: messageCreatedAt
  }
})