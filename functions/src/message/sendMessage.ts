import { FieldValue } from '@google-cloud/firestore'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Message, OnlineState, User, UserOnlineStatus } from '..'
import { database, getMessageCollection, messaging, roomCollection } from '../lib/firebase'
import { messageIdGenerator } from '../lib/generator/idGenerator'
import { messageMediaToTextGenerator } from '../lib/generator/textGenerator'
import { getUserDocument } from '../lib/user'

type SendMessageArguments = Omit<Message, 'messageId' | 'createdAt' | 'deletedAt'>

type SendMessageResponse = Promise<Pick<Message, 'roomId' | 'requestedId' | 'messageId'>>

export const sendMessage = functions.https.onCall(async (messageData: SendMessageArguments, context): SendMessageResponse => {
  const {
    requestedId,
    roomId,
    senderUserId,
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

  const receiverDoc = await getUserDocument(receiverUserId)
  const receiver = receiverDoc.data() as User

  const messageCreatedAt = Date.now()
  const messageId = messageIdGenerator()
  const messageCollection = getMessageCollection(roomId)

  const newMessage: Message = {
    requestedId,
    messageId,
    roomId,
    senderUserId,
    receiverUserId,
    text: text ? text : undefined,
    media: media ? media : undefined,
    createdAt: messageCreatedAt,
  }

  await messageCollection.doc(messageId).set(newMessage)

  const receiverStatusStore = database.ref('/status/' + receiverUserId)
  const receiverStatusSnapshot = await receiverStatusStore.once('value')
  const receiverStatue = receiverStatusSnapshot.val() as UserOnlineStatus
  const isReceiverOnline = receiverStatue && receiverStatue.state === OnlineState.ONLINE ? true : false
  const isJoinedConversationNow = receiverStatue && receiverStatue.joinedRoomId ? receiverStatue.joinedRoomId === roomId : false

  //send push notification
  if (receiver.pushToken) {
    if (isReceiverOnline) {
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

  await roomCollection.doc(roomId).set({
    lastMessage: newMessage,
    updatedAt: messageCreatedAt,
    unreadMessageCount: {
      [receiverUserId]: isJoinedConversationNow ? 0 : FieldValue.increment(1),
    },
  }, {
    merge: true
  })

  return {
    roomId,
    requestedId,
    messageId
  }
})