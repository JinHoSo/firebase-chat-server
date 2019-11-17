import { DocumentSnapshot, QuerySnapshot, WriteResult } from '@google-cloud/firestore';

import { GroupRoom, PrivateRoom, RoomId, UserId, Room, Timestamp } from '..';
import {roomCollection} from './constration'

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
  return await roomCollection.doc(roomId).get()
}

export const updateRoomDocument = async (roomId: RoomId, roomData: Partial<Omit<Room, 'roomId' | 'updatedAt'>>): Promise<WriteResult> => {
  const roomDoc = await getRoomDocument(roomId)

  if (!roomDoc.exists) {
    throw `room(${roomId} is not exists)`
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
  const roomDoc = await getRoomDocument(roomId)

  if (!roomDoc.exists) {
    throw `room(${roomId} is not exists)`
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
    throw `room(${roomId} is not exists)`
  }

  return await roomCollection
    .doc(roomId)
    .delete()
}

export const getRoomDocumentsOrderByUpdatedAt = async (userId: UserId, limit = 30): Promise<QuerySnapshot> => {
  const roomsDocs = await roomCollection
    // .where(`userIdMap.${userId}`, '==', true)
    .where('userIdArray', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()

  return roomsDocs
}

export const getRoomDocumentsAfterUpdatedAt = async (userId: UserId, afterUpdatedAt:Timestamp, limit = 30): Promise<QuerySnapshot> => {
  const roomsDocs = await roomCollection
    // .where(`userIdMap.${userId}`, '==', true)
    .where('userIdArray', 'array-contains', userId)
    .where(`updatedAt`, '>', afterUpdatedAt)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get()

  return roomsDocs
}

export const getRoomDocumentsAfterRoomIdAndOrderByUpdatedAt = async (userId: UserId, afterRoomId: RoomId, limit = 30): Promise<QuerySnapshot> => {
  const endBeforeRoomDoc = await roomCollection
    .doc(afterRoomId)
    .get()

  if (!endBeforeRoomDoc.exists) {
    throw `after room(${afterRoomId}) is not exists`
  }

  const roomsDocs = await roomCollection
    // .where(`userIdMap.${userId}`, '==', true)
    .where('userIdArray', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .endBefore(endBeforeRoomDoc)
    .limit(limit)
    .get()

  return roomsDocs
}

export const getRoomDocumentsAfterRoomDocumentAndOrderByUpdatedAt = async (userId: UserId, afterRoomDocument: DocumentSnapshot, limit = 30): Promise<QuerySnapshot> => {
  const roomsDocs = await roomCollection
    // .where(`userIdMap.${userId}`, '==', true)
    .where('userIdArray', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .endBefore(afterRoomDocument)
    .limit(limit)
    .get()

  return roomsDocs
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