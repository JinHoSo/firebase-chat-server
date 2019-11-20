import { DocumentSnapshot, WriteResult } from '@google-cloud/firestore'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { Room, RoomId, RoomUser, User, UserId } from '..'
import { COLLECTION_GROUP_USER_NAME, firestore, userCollection } from './firebase'
import { getRoomDocument } from './room'

export const isExistsUser = async (userId: UserId): Promise<boolean> => {
  const userDoc = await getUserDocument(userId)
  const user = userDoc.data() as User

  if (!userDoc.exists || (user && user.leftAt)) {
    return false
  }

  return true
}

export const getUserDocument = async (userId: UserId): Promise<DocumentSnapshot> => {
  const userDoc = await userCollection.doc(userId).get()
  const user = userDoc.data() as User

  if (!userDoc.exists) {
    throw new HttpsError('not-found', `user(${userId}) is not exists`, {
      userId
    })
  }

  if (user && user.leftAt) {
    throw new HttpsError('unavailable', `user(${userId}) is left`, {
      userId,
      leftAt: user.leftAt
    })
  }

  return await userCollection.doc(userId).get()
}

//Retrieve users include user who do not exists or have left.
export const getUserDocuments = async (userIds: UserId[]): Promise<DocumentSnapshot[]> => {
  const userRefs = userIds.map(userId => firestore.doc(`${COLLECTION_GROUP_USER_NAME}/${userId}`))
  const users = await firestore.getAll(...userRefs)

  return users
}

export const createUserDocument = async (userId: UserId, userData: Omit<User, 'userId' | 'registeredAt'>): Promise<WriteResult> => {
  const userDoc = await getUserDocument(userId)

  if (userDoc.exists) {
    throw new HttpsError('already-exists', `userId(${userId}) is already exists`, {
      userId
    })
  }
  else {
    const newUser: User = {
      ...userData,
      userId,
      registeredAt: Date.now()
    }

    return await userCollection
      .doc(userId)
      .set(newUser)
  }
}

export const updateUserDocument = async (userId: UserId, userData: Partial<Omit<User, 'userId'>>): Promise<WriteResult> => {
  if (!(await isExistsUser(userId))) {
    throw new HttpsError('not-found', `user(${userId}) is not exists`, {
      userId
    })
  }

  const updatedUserData: Partial<User> = {
    ...userData,
    updatedAt: Date.now()
  }

  return await userCollection
    .doc(userId)
    .set(updatedUserData, { merge: true })
}

export const deleteUserDocument = async (userId: UserId): Promise<WriteResult> => {
  if (!(await isExistsUser(userId))) {
    throw new HttpsError('not-found', `user(${userId}) is not exists`, {
      userId
    })
  }

  const deletedUserData: Pick<User, 'leftAt'> = {
    leftAt: Date.now()
  }

  return await userCollection
    .doc(userId)
    .set(deletedUserData, { merge: true })
}

export const cleanUserDocument = async (userId: UserId): Promise<WriteResult> => {
  if (!(await isExistsUser(userId))) {
    throw new HttpsError('not-found', `user(${userId}) is not exists`, {
      userId
    })
  }

  return await userCollection
    .doc(userId)
    .delete()
}

export const getUsersInRoom = async (roomId: RoomId): Promise<RoomUser[]> => {
  const roomDoc = await getRoomDocument(roomId)

  if (!roomDoc.exists) {
    throw new HttpsError('not-found', `room(${roomId} is not exists)`, {
      roomId
    })
  }

  const room = roomDoc.data() as Room

  const userDocs = await getUserDocuments(room.userIdArray as string[])

  const roomUsers: RoomUser[] = userDocs.map(userDoc => {
    const user = userDoc.data() as User

    return {
      userId: user.userId,
      nickname: user.nickname,
      avatar: user.avatar
    }
  })

  return roomUsers
} 