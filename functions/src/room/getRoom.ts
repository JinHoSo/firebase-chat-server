import * as functions from 'firebase-functions';

import { Room, RoomId, Timestamp, UserId } from '..';
import {
  getRoomDocument,
  getRoomDocumentsAfterRoomIdAndOrderByUpdatedAt,
  getRoomDocumentsAfterUpdatedAt,
  getRoomDocumentsOrderByUpdatedAt,
} from '../lib/room';

const ROOM_PAGE_LIMIT = 15

type GetRoomArguments = {
  roomId: RoomId
}

type GetRoomsArguments = {
  pageLimit?: number
}

interface GetRoomsAfterRoomIdArguments extends GetRoomsArguments {
  afterRoomId: string
}

interface GetRoomsAfterUpdatedAtArguments extends GetRoomsArguments {
  updatedAt: Timestamp
}

export const getRoom = functions.https.onCall(async (roomData: GetRoomArguments, context): Promise<Room> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const { roomId } = roomData
  const roomDoc = await getRoomDocument(roomId)

  if (roomDoc.exists) {
    return roomDoc.data() as Room
  }
  else {
    throw `the room(${roomId}) is not exists`
  }
})

export const getRooms = functions.https.onCall(async (roomData: GetRoomsArguments, context): Promise<Room[]> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const pageLimit = roomData.pageLimit || ROOM_PAGE_LIMIT
  const myUserId = context.auth!.uid as UserId
  const roomDocs = await getRoomDocumentsOrderByUpdatedAt(myUserId, pageLimit)

  if (roomDocs.size > 0) {
    return roomDocs.docs.map((roomDoc) => roomDoc.data()) as Room[]
  }
  else {
    return []
  }
})

export const getRoomsAfterRoomId = functions.https.onCall(async (roomData: GetRoomsAfterRoomIdArguments, context): Promise<Room[]> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const pageLimit = roomData.pageLimit || ROOM_PAGE_LIMIT
  const myUserId = context.auth!.uid as UserId
  const { afterRoomId } = roomData

  const roomDocs = await getRoomDocumentsAfterRoomIdAndOrderByUpdatedAt(myUserId, afterRoomId, pageLimit)

  if (roomDocs.size > 0) {
    return roomDocs.docs.map((roomDoc) => roomDoc.data()) as Room[]
  }
  else {
    return []
  }
})

export const getRoomsAfterUpdatedAt = functions.https.onCall(async (roomData: GetRoomsAfterUpdatedAtArguments, context): Promise<Room[]> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const pageLimit = roomData.pageLimit || ROOM_PAGE_LIMIT
  const myUserId = context.auth!.uid as UserId
  const { updatedAt } = roomData

  const roomDocs = await getRoomDocumentsAfterUpdatedAt(myUserId, updatedAt, pageLimit)

  if (roomDocs.size > 0) {
    return roomDocs.docs.map((roomDoc) => roomDoc.data()) as Room[]
  }
  else {
    return []
  }
})