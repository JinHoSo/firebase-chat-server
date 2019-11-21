import { DocumentSnapshot, QuerySnapshot, WriteResult } from '@google-cloud/firestore'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Message, MessageId, RoomId, Timestamp } from '..'
import { getMessageCollection } from './firebase'
import { dateNowGenerator } from './generator/dateGenerator';

export type CreateMessageDocumentData = Omit<Message, 'roomId'| 'messageId' | 'createdAt' | 'updatedAt' | 'deletedAt'>

export const isExistsMessage = async (roomId: RoomId, messageId: MessageId): Promise<boolean> => {
  const messageDoc = await getMessageCollection(roomId).doc(messageId).get()
  return messageDoc.exists
}

export const createMessageDocument = async (roomId:RoomId, messageId:MessageId, messageData: CreateMessageDocumentData): Promise<WriteResult> => {
  const messageCreatedAt = dateNowGenerator()

  if(!messageData.media){
    delete messageData.media
  }

  if(!messageData.text){
    delete messageData.text
  }

  if(!messageData.receiverUserId){
    delete messageData.receiverUserId
  }

  const newMessageData: Message = {
    ...messageData,
    roomId,
    messageId,
    createdAt: messageCreatedAt,
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

export const updateTextMessageDocument = async (roomId: RoomId, messageId: MessageId, text:string): Promise<WriteResult> => {
  if (!(await isExistsMessage(roomId, messageId))) {
    throw new HttpsError('not-found', `message(${messageId}) in the room(${roomId}) is not exists`, {
      messageId,
      roomId
    })
  }

  const messageUpdatedAt = dateNowGenerator()
  const updatedMessageData: Pick<Message, 'text' | 'updatedAt'> = {
    text,
    updatedAt: messageUpdatedAt
  }

  return await getMessageCollection(roomId)
    .doc(messageId)
    .set(updatedMessageData, { merge: true })
}

export const deleteMessageDocument = async (roomId: RoomId, messageId: MessageId): Promise<WriteResult> => {
  if (!(await isExistsMessage(roomId, messageId))) {
    throw new HttpsError('not-found', `message(${messageId}) in the room(${roomId}) is not exists`, {
      messageId,
      roomId
    })
  }

  const messageDeleteddAt = dateNowGenerator()
  const deletedMessageData: Pick<Message, 'text' | 'deletedAt'> = {
    text: '',
    deletedAt: messageDeleteddAt
  }

  return await getMessageCollection(roomId)
    .doc(messageId)
    .set(deletedMessageData, { merge: true })
}

export const cleanMessageDocument = async (roomId: RoomId, messageId: MessageId): Promise<WriteResult> => {
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

export const getMessageDocumentsBeforeCreatedAt = async (roomId: RoomId, afterCreatedAt: Timestamp, limit = 30): Promise<QuerySnapshot> => {
  return await getMessageCollection(roomId)
    .where(`createdAt`, '<', afterCreatedAt)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()
}

export const getMessageDocumentsBeforeMessageIdAndOrderByCreatedAt = async (roomId: RoomId, afterMessageId: MessageId, limit = 30): Promise<QuerySnapshot> => {
  const endBeforeMessageDoc = await getMessageDocument(roomId, afterMessageId)

  if (!endBeforeMessageDoc.exists) {
    throw new HttpsError('not-found', `message(${afterMessageId}) in the room(${roomId}) is not exists`, {
      messageId: afterMessageId,
      roomId
    })
  }

  return await getMessageCollection(roomId)
    .orderBy('createdAt', 'desc')
    .startAfter(endBeforeMessageDoc)
    .limit(limit)
    .get()
}

export const getMessageDocumentsBeforeMessageDocumentAndOrderByCreatedAt = async (roomId: RoomId, afterMessageDocument: DocumentSnapshot, limit = 30): Promise<QuerySnapshot> => {
  return await getMessageCollection(roomId)
    .orderBy('createdAt', 'desc')
    .startAfter(afterMessageDocument)
    .limit(limit)
    .get()
}