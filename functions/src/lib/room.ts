import { DocumentSnapshot, QuerySnapshot, WriteResult } from '@google-cloud/firestore'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { GroupRoom, PrivateRoom, Room, RoomId, Timestamp, UserId } from '..'
import { roomCollection } from './firebase'

export const isExistsRoom = async (roomId: RoomId): Promise<boolean> => {
  const roomDoc = await getRoomDocument(roomId)
  return roomDoc.exists
}

export const createRoomDocument = async (roomId: RoomId, roomData: Omit<GroupRoom, 'roomId' | 'createdAt' | 'updatedAt'>): Promise<WriteResult> => {
  const newRoomCreatedAt = Date.now()

  const newRoomData: GroupRoom = {
    ...roomData,
    roomId,
    createdAt: newRoomCreatedAt,
    updatedAt: newRoomCreatedAt
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

export const updateRoomDocument = async (roomId: RoomId, roomData: Partial<Omit<Room, 'roomId' | 'updatedAt'>>): Promise<WriteResult> => {
  if (!(await isExistsRoom(roomId))) {
    throw new HttpsError('not-found', `room(${roomId} is not exists)`, {
      roomId
    })
  }

  const updatedRoomData = {
    ...roomData,
    updatedAt: Date.now()
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

  const deletedRoomData: Pick<GroupRoom, 'deletedAt'> = {
    deletedAt: Date.now()
  }

  return await roomCollection
    .doc(roomId)
    .set(deletedRoomData, { merge: true })
}

export const cleanRoomDocument = async (roomId: RoomId): Promise<WriteResult> => {
  if (!(await isExistsRoom(roomId))) {
    throw new HttpsError('not-found', `room(${roomId} is not exists)`, {
      roomId
    })
  }

  return await roomCollection
    .doc(roomId)
    .delete()
}

export const getRoomDocumentsOrderByUpdatedAt = async (userId: UserId, limit = 30): Promise<QuerySnapshot> => {
  return await roomCollection
    // .where(`userIdMap.${userId}`, '==', true)
    .where('userIdArray', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()
}

export const getRoomDocumentsAfterUpdatedAt = async (userId: UserId, afterUpdatedAt: Timestamp, limit = 30): Promise<QuerySnapshot> => {
  return await roomCollection
    // .where(`userIdMap.${userId}`, '==', true)
    .where('userIdArray', 'array-contains', userId)
    .where(`updatedAt`, '>', afterUpdatedAt)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()
}

export const getRoomDocumentsAfterRoomIdAndOrderByUpdatedAt = async (userId: UserId, afterRoomId: RoomId, limit = 30): Promise<QuerySnapshot> => {
  const endBeforeRoomDoc = await getRoomDocument(afterRoomId)

  return await roomCollection
    // .where(`userIdMap.${userId}`, '==', true)
    .where('userIdArray', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .endBefore(endBeforeRoomDoc)
    .limit(limit)
    .get()
}

export const getRoomDocumentsAfterRoomDocumentAndOrderByUpdatedAt = async (userId: UserId, afterRoomDocument: DocumentSnapshot, limit = 30): Promise<QuerySnapshot> => {
  return await roomCollection
    // .where(`userIdMap.${userId}`, '==', true)
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