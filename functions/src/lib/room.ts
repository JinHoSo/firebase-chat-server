import { DocumentSnapshot, QuerySnapshot, WriteResult } from '@google-cloud/firestore'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { GroupRoom, PrivateRoom, Room, RoomId, Timestamp, UserId } from '..'
import { roomCollection } from './firebase'
import { dateNowGenerator } from './generator/dateGenerator';

export type CreateRoomDocumentData = Omit<GroupRoom, 'roomId' | 'createdAt' | 'updatedAt'>
export type UpdateRoomDocumentData = Partial<Omit<Room, 'roomId' | 'updatedAt'>>

export const isExistsRoom = async (roomId: RoomId): Promise<boolean> => {
  const roomDoc = await roomCollection.doc(roomId).get()
  return roomDoc.exists
}

export const createRoomDocument = async (roomId: RoomId, roomData: CreateRoomDocumentData): Promise<WriteResult> => {
  const roomCreatedAt = dateNowGenerator()

  const newRoomData: GroupRoom = {
    ...roomData,
    roomId,
    createdAt: roomCreatedAt,
    updatedAt: roomCreatedAt
  }

  return await roomCollection
    .doc(roomId)
    .set(newRoomData)
}

export const getRoomDocument = async (roomId: RoomId): Promise<DocumentSnapshot> => {
  const roomDoc = await roomCollection.doc(roomId).get()
  if (!roomDoc.exists) {
    throw new HttpsError('not-found', `room(${roomId}) is not exists`, {
      roomId
    })
  }

  return roomDoc
}

export const getRoomData = async (roomId: RoomId): Promise<Room> => {
  const roomDoc = await getRoomDocument(roomId)

  return roomDoc.data() as Room
}

export const updateRoomDocument = async (roomId: RoomId, roomData: UpdateRoomDocumentData): Promise<WriteResult> => {
  if (!(await isExistsRoom(roomId))) {
    throw new HttpsError('not-found', `room(${roomId} is not exists)`, {
      roomId
    })
  }

  const roomUpdatedAt = dateNowGenerator()

  const updatedRoomData = {
    ...roomData,
    updatedAt: roomUpdatedAt
  }

  return await roomCollection
    .doc(roomId)
    .set(updatedRoomData, { merge: true })
}

export const deleteRoomDocument = async (roomId: RoomId): Promise<WriteResult> => {
  if (!(await isExistsRoom(roomId))) {
    throw new HttpsError('not-found', `room(${roomId} is not exists)`, {
      roomId
    })
  }

  const roomDeletedAt = dateNowGenerator()

  const deletedRoomData: Pick<GroupRoom, 'deletedAt'> = {
    deletedAt: roomDeletedAt
  }

  return await roomCollection
    .doc(roomId)
    .set(deletedRoomData, { merge: true })
}

export const cleanRoomDocument = async (roomId: RoomId): Promise<WriteResult> => {
  return await roomCollection
    .doc(roomId)
    .delete()
}

export const getRoomDocumentsOrderByUpdatedAt = async (userId: UserId, limit = 30): Promise<QuerySnapshot> => {
  return await roomCollection
    .where('userIdArray', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()
}

export const getRoomDocumentsAfterUpdatedAt = async (userId: UserId, afterUpdatedAt: Timestamp, limit = 30): Promise<QuerySnapshot> => {
  return await roomCollection
    .where('userIdArray', 'array-contains', userId)
    .where(`updatedAt`, '>', afterUpdatedAt)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()
}

export const getRoomDocumentsAfterRoomIdAndOrderByUpdatedAt = async (userId: UserId, afterRoomId: RoomId, limit = 30): Promise<QuerySnapshot> => {
  const endBeforeRoomDoc = await getRoomDocument(afterRoomId)

  return await roomCollection
    .where('userIdArray', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .endBefore(endBeforeRoomDoc)
    .limit(limit)
    .get()
}

export const getRoomDocumentsAfterRoomDocumentAndOrderByUpdatedAt = async (userId: UserId, afterRoomDocument: DocumentSnapshot, limit = 30): Promise<QuerySnapshot> => {
  return await roomCollection
    .where('userIdArray', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .endBefore(afterRoomDocument)
    .limit(limit)
    .get()
}

export const hasPrivateRoomDocument = async (senderUserId: UserId, receiverUserId: UserId): Promise<boolean> => {
  const roomsDocs = await roomCollection
    .where(`userIdMap.${senderUserId}`, '==', true)
    .where(`userIdMap.${receiverUserId}`, '==', true)
    .get()

  if (roomsDocs.size > 0) {
    return true
  }
  else {
    return false
  }
}

export const getPrivateRoomData = async (senderUserId: UserId, receiverUserId: UserId): Promise<PrivateRoom | null> => {
  const roomsDocs = await roomCollection
    .where(`userIdMap.${senderUserId}`, '==', true)
    .where(`userIdMap.${receiverUserId}`, '==', true)
    .get()

  if (roomsDocs.size > 0) {
    const roomDoc = roomsDocs.docs[0]

    if (roomDoc.exists) {
      return roomDoc.data() as PrivateRoom
    }
  }

  return null
}