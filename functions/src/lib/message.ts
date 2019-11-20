import { DocumentSnapshot, QuerySnapshot, WriteResult } from '@google-cloud/firestore'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Message, MessageId, RoomId, Timestamp } from '..'
import { getMessageCollection } from './firebase'

export const isExistsMessage = async (roomId: RoomId, messageId: MessageId): Promise<boolean> => {
  const userDoc = await getMessageDocument(roomId, messageId)
  return userDoc.exists
}

export const createMessageDocument = async (roomId: RoomId, messageId: MessageId, messageData: Omit<Message, 'messageId' | 'createdAt' | 'deletedAt'>): Promise<WriteResult> => {
  const newMessageCreatedAt = Date.now()

  const newMessageData: Message = {
    ...messageData,
    messageId,
    createdAt: newMessageCreatedAt,
  }

  return await getMessageCollection(roomId)
    .doc(messageId)
    .set(newMessageData)
}

export const getMessageDocument = async (roomId: RoomId, messageId: MessageId): Promise<DocumentSnapshot> => {
  const messageDoc = await getMessageCollection(roomId).doc(messageId).get()
  if (!messageDoc.exists) {
    throw new HttpsError('not-found', `message(${messageId}) in the room(${roomId}) is not exists`, {
      messageId,
      roomId
    })
  }

  return messageDoc
}

export const deleteMessageDocument = async (roomId: RoomId, messageId: MessageId): Promise<WriteResult> => {
  if (!(await isExistsMessage(roomId, messageId))) {
    throw new HttpsError('not-found', `message(${messageId}) in the room(${roomId}) is not exists`, {
      messageId,
      roomId
    })
  }

  const deletedMessageData: Pick<Message, 'text' | 'deletedAt'> = {
    text: '',
    deletedAt: Date.now()
  }

  return await getMessageCollection(roomId)
    .doc(messageId)
    .set(deletedMessageData, { merge: true })
}

export const cleanMessageDocument = async (roomId: RoomId, messageId: MessageId): Promise<WriteResult> => {
  if (!(await isExistsMessage(roomId, messageId))) {
    throw new HttpsError('not-found', `message(${messageId}) in the room(${roomId}) is not exists`, {
      messageId,
      roomId
    })
  }

  return await getMessageCollection(roomId)
    .doc(messageId)
    .delete()
}

export const getMessageDocumentsOrderByCreatedAt = async (roomId: RoomId, limit = 30): Promise<QuerySnapshot> => {
  return await getMessageCollection(roomId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
}

export const getMessageDocumentsAfterCreatedAt = async (roomId: RoomId, afterCreatedAt: Timestamp, limit = 30): Promise<QuerySnapshot> => {
  return await getMessageCollection(roomId)
    .where(`createdAt`, '>', afterCreatedAt)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
}

export const getMessageDocumentsAfterMessageIdAndOrderByCreatedAt = async (roomId: RoomId, afterMessageId: MessageId, limit = 30): Promise<QuerySnapshot> => {
  const endBeforeMessageDoc = await getMessageDocument(roomId, afterMessageId)

  if (!endBeforeMessageDoc.exists) {
    throw new HttpsError('not-found', `message(${afterMessageId}) in the room(${roomId}) is not exists`, {
      messageId: afterMessageId,
      roomId
    })
  }

  return await getMessageCollection(roomId)
    .orderBy('createdAt', 'desc')
    .endBefore(endBeforeMessageDoc)
    .limit(limit)
    .get()
}

export const getMessageDocumentsAfterMessageDocumentAndOrderByCreatedAt = async (roomId: RoomId, afterMessageDocument: DocumentSnapshot, limit = 30): Promise<QuerySnapshot> => {
  return await getMessageCollection(roomId)
    .orderBy('createdAt', 'desc')
    .endBefore(afterMessageDocument)
    .limit(limit)
    .get()
}