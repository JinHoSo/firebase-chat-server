import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Message, MessageId, RoomId, Timestamp } from '..'
import {
  getMessageDocument,
  getMessageDocumentsBeforeCreatedAt,
  getMessageDocumentsBeforeMessageIdAndOrderByCreatedAt,
  getMessageDocumentsOrderByCreatedAt,
} from '../lib/message'

const ROOM_PAGE_LIMIT = 15

export type GetMessageData = Pick<Message, 'roomId' | 'messageId'>

export type GetMessageResult = Message

export type GetMessagesData = {
  roomId: RoomId
  pageLimit?: number
}

export interface GetMessagesBeforeMessageIdData extends GetMessagesData {
  afterMessageId: string
}

export interface GetMessagesBeforeCreatedAtData extends GetMessagesData {
  afterCreatedAt: Timestamp
}

export type GetMessagesResult = Message[]

export const getMessage = functions.https.onCall(async (messageData: GetMessageData, context): Promise<GetMessageResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const { roomId, messageId } = messageData
  const messageDoc = await getMessageDocument(roomId, messageId)

  return messageDoc.data() as Message
})

export const getMessages = functions.https.onCall(async (messageData: GetMessagesData, context): Promise<GetMessagesResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const { roomId } = messageData
  const pageLimit = messageData.pageLimit || ROOM_PAGE_LIMIT
  const messageDocs = await getMessageDocumentsOrderByCreatedAt(roomId, pageLimit)

  if (messageDocs.size > 0) {
    return messageDocs.docs.map((messageDoc) => messageDoc.data()) as Message[]
  }
  else {
    return []
  }
})

export const getMessagesBeforeMessageId = functions.https.onCall(async (messageData: GetMessagesBeforeMessageIdData, context): Promise<GetMessagesResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const { roomId, afterMessageId } = messageData
  const pageLimit = messageData.pageLimit || ROOM_PAGE_LIMIT

  const messageDocs = await getMessageDocumentsBeforeMessageIdAndOrderByCreatedAt(roomId, afterMessageId, pageLimit)

  if (messageDocs.size > 0) {
    return messageDocs.docs.map((messageDoc) => messageDoc.data()) as Message[]
  }
  else {
    return []
  }
})

export const getMessagesBeforeCreatedAt = functions.https.onCall(async (messageData: GetMessagesBeforeCreatedAtData, context): Promise<GetMessagesResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const pageLimit = messageData.pageLimit || ROOM_PAGE_LIMIT
  const { roomId, afterCreatedAt } = messageData

  const messageDocs = await getMessageDocumentsBeforeCreatedAt(roomId, afterCreatedAt, pageLimit)

  if (messageDocs.size > 0) {
    return messageDocs.docs.map((messageDoc) => messageDoc.data()) as Message[]
  }
  else {
    return []
  }
})