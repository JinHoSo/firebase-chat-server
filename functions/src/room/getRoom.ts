import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Room, Timestamp, UserId } from '..'
import {
  getRoomDocument,
  getRoomDocumentsAfterRoomIdAndOrderByUpdatedAt,
  getRoomDocumentsAfterUpdatedAt,
  getRoomDocumentsOrderByUpdatedAt,
} from '../lib/room'

const ROOM_PAGE_LIMIT = 15

export type GetRoomData = Pick<Room, 'roomId'>

export type GetRoomResult = Room

export type GetRoomsData = {
  pageLimit?: number
}

export type GetRoomsResult = Room[]

export interface GetRoomsAfterRoomIdData extends GetRoomsData {
  afterRoomId: string
}

export interface GetRoomsAfterUpdatedAtData extends GetRoomsData {
  afterUpdatedAt: Timestamp
}

export const getRoom = functions.https.onCall(async (roomData: GetRoomData, context): Promise<GetRoomResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const { roomId } = roomData
  const roomDoc = await getRoomDocument(roomId)

  return roomDoc.data() as Room
})

export const getRooms = functions.https.onCall(async (roomData: GetRoomsData, context): Promise<GetRoomsResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
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

export const getRoomsAfterRoomId = functions.https.onCall(async (roomData: GetRoomsAfterRoomIdData, context): Promise<GetRoomsResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
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

export const getRoomsAfterUpdatedAt = functions.https.onCall(async (roomData: GetRoomsAfterUpdatedAtData, context): Promise<GetRoomsResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const pageLimit = roomData.pageLimit || ROOM_PAGE_LIMIT
  const myUserId = context.auth!.uid as UserId
  const { afterUpdatedAt } = roomData

  const roomDocs = await getRoomDocumentsAfterUpdatedAt(myUserId, afterUpdatedAt, pageLimit)

  if (roomDocs.size > 0) {
    return roomDocs.docs.map((roomDoc) => roomDoc.data()) as Room[]
  }
  else {
    return []
  }
})