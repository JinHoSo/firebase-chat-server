import * as functions from 'firebase-functions';

import { GroupRoom, PrivateRoom, UserId } from '..';
import { roomIdGenerator } from '../lib/generator/idGenerator';
import { createRoomDocument, getPrivateRoomData, getRoomDocument } from '../lib/room';
import { isExistsUser } from '../lib/user';

type CreatePrivateRoomArguments = {
  receiverUserId: UserId
}

type CreateGroupRoomArguments = {
  receiverUserIds: UserId[]
}

export const createPrivateRoom = functions.https.onCall(async (roomData: CreatePrivateRoomArguments, context): Promise<PrivateRoom> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const senderUserId = context.auth!.uid as UserId
  const receiverUserId = roomData.receiverUserId

  if (senderUserId === receiverUserId) {
    throw 'sender and receiver are same'
  }

  const privateRoomData = await getPrivateRoomData(senderUserId, receiverUserId)

  if (privateRoomData) {
    return privateRoomData
  }
  else {
    const isSenderExists = await isExistsUser(senderUserId)
    if (!isSenderExists) {
      throw `sender(${senderUserId} is not exists)`
    }

    const isReceiverExists = await isExistsUser(receiverUserId)
    if (!isReceiverExists) {
      throw `receiver(${receiverUserId} is not exists)`
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

    if (createdRoomDoc.exists) {
      return createdRoomDoc.data() as PrivateRoom
    }
    else {
      throw `Failed to get private room(${newPrivateRoomId}) after creating the room`
    }
  }
})

export const createGroupRoom = functions.https.onCall(async (roomData: CreateGroupRoomArguments, context): Promise<GroupRoom> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const senderUserId: UserId = context.auth!.uid as UserId
  const { receiverUserIds } = roomData

  if (receiverUserIds.findIndex(userId => userId === senderUserId) !== -1) {
    throw `sender${senderUserId} can\'t be assigend to receivers`
  }

  const isSenderExists = await isExistsUser(senderUserId)
  if (!isSenderExists) {
    throw `sender(${senderUserId} is already exists)`
  }

  receiverUserIds.forEach(async receiverUserId => {
    const isReceiverExists = await isExistsUser(receiverUserId)
    if (!isReceiverExists) {
      throw `receiver(${receiverUserId} is already exists)`
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

  if (createdRoomDoc.exists) {
    return createdRoomDoc.data() as GroupRoom
  }
  else {
    throw `Failed to get a room(${newRoomId}) after creating the room`
  }
})