import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { GroupRoom, PrivateRoom, UserId } from '..'
import { roomIdGenerator } from '../lib/generator/idGenerator'
import { createRoomDocument, getPrivateRoomData, getRoomDocument } from '../lib/room'
import { isExistsUser } from '../lib/user'

type CreatePrivateRoomArguments = {
  receiverUserId: UserId
}

type CreateGroupRoomArguments = {
  receiverUserIds: UserId[]
}

export const createPrivateRoom = functions.https.onCall(async (roomData: CreatePrivateRoomArguments, context): Promise<PrivateRoom> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const senderUserId = context.auth!.uid as UserId
  const receiverUserId = roomData.receiverUserId

  if (senderUserId === receiverUserId) {
    throw new HttpsError('invalid-argument', 'sender and receiver are same')
  }

  const privateRoomData = await getPrivateRoomData(senderUserId, receiverUserId)

  if (privateRoomData) {
    return privateRoomData
  }
  else {
    const isSenderExists = await isExistsUser(senderUserId)
    if (!isSenderExists) {
      throw new HttpsError('not-found', `sender(${senderUserId}) is not exists`, {
        userId: senderUserId
      })
    }

    const isReceiverExists = await isExistsUser(receiverUserId)
    if (!isReceiverExists) {
      throw new HttpsError('not-found', `receiver(${receiverUserId} is not exists)`, {
        userId: receiverUserId
      })
    }

    const newPrivateRoomId = roomIdGenerator()

    const newPrivateRoom: Pick<PrivateRoom, 'userIdMap' | 'userIdArray' | 'unreadMessageCount'> = {
      userIdMap: {
        [senderUserId]: true,
        [receiverUserId]: true,
      },
      userIdArray: [senderUserId, receiverUserId],
      unreadMessageCount: {
        [senderUserId]: 0,
        [receiverUserId]: 0,
      },
    }

    await createRoomDocument(newPrivateRoomId, newPrivateRoom)
    const createdRoomDoc = await getRoomDocument(newPrivateRoomId)

    return createdRoomDoc.data() as PrivateRoom
  }
})

export const createGroupRoom = functions.https.onCall(async (roomData: CreateGroupRoomArguments, context): Promise<GroupRoom> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const senderUserId: UserId = context.auth!.uid as UserId
  const { receiverUserIds } = roomData

  if (receiverUserIds.findIndex(userId => userId === senderUserId) !== -1) {
    throw new HttpsError('invalid-argument', `sender${senderUserId} can\'t be assigend to receivers`, {
      userId: senderUserId
    })
  }

  const isSenderExists = await isExistsUser(senderUserId)
  if (!isSenderExists) {
    throw new HttpsError('not-found', `sender(${senderUserId}) is not exists`, {
      userId: senderUserId
    })
  }

  receiverUserIds.forEach(async receiverUserId => {
    const isReceiverExists = await isExistsUser(receiverUserId)
    if (!isReceiverExists) {
      throw new HttpsError('not-found', `receiver(${receiverUserId} is not exists)`, {
        userId: receiverUserId
      })
    }
  })

  const newRoomId = roomIdGenerator()

  const unreadMessageCount = receiverUserIds.reduce((accumulator, receiverUserId) => {
    accumulator[receiverUserId] = 0
    return accumulator
  }, { [senderUserId]: 0 })

  const userIdArray = [senderUserId, ...receiverUserIds]

  const newRoom: Pick<GroupRoom, 'userIdArray' | 'unreadMessageCount'> = {
    userIdArray: userIdArray,
    unreadMessageCount: unreadMessageCount,
  }

  await createRoomDocument(newRoomId, newRoom)

  const createdRoomDoc = await getRoomDocument(newRoomId)

  return createdRoomDoc.data() as GroupRoom
})