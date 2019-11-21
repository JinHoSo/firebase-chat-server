import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Message, OnlineState, User, UserId, UserOnlineStatus } from '..'
import { database, messaging, roomCollection } from '../lib/firebase'
import { dateNowGenerator } from '../lib/generator/dateGenerator'
import { messageIdGenerator } from '../lib/generator/idGenerator'
import { messageMediaToTextGenerator } from '../lib/generator/textGenerator'
import { createMessageDocument, CreateMessageDocumentData } from '../lib/message'
import { getUserDocument } from '../lib/user'

export type SendMessageData = Omit<Message, 'senderUserId' | 'messageId' | 'createdAt' | 'deletedAt'>

export type SendMessageResult = Pick<Message, 'roomId' | 'requestedId' | 'messageId' | 'createdAt'>

export const sendMessage = functions.https.onCall(async (messageData: SendMessageData, context): Promise<SendMessageResult> => {
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

  const newMessage: CreateMessageDocumentData = {
    requestedId,
    senderUserId,
    receiverUserId,
    text,
    media
  }

  await createMessageDocument(roomId, messageId, newMessage)

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