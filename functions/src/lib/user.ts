import { DocumentSnapshot, WriteResult } from '@google-cloud/firestore';

import { Room, RoomId, RoomUser, User, UserId } from '..';
import { COLLECTION_GROUP_USER_NAME, firestore, userCollection } from './constration';
import { getRoomDocument } from './room';

export const getUserDocument = async (userId: UserId): Promise<DocumentSnapshot> => {
  return await userCollection.doc(userId).get()
}

export const getUserDocuments = async (userIds: UserId[]): Promise<DocumentSnapshot[]> => {
  const userRefs = userIds.map(userId => firestore.doc(`${COLLECTION_GROUP_USER_NAME}/${userId}`))
  const users = await firestore.getAll(...userRefs)

  return users
}

export const isExistsUser = async (userId: UserId): Promise<boolean> => {
  const userDoc = await getUserDocument(userId)
  return userDoc.exists
}

export const createUserDocument = async (userId: UserId, userData: Omit<User, 'userId' | 'registeredAt'>): Promise<WriteResult> => {
  const userDoc = await getUserDocument(userId)

  if (!userDoc.exists) {
    const newUser: User = {
      ...userData,
      userId,
      registeredAt: Date.now()
    }

    return await userCollection
      .doc(userId)
      .set(newUser)
  }
  else {
    throw `user(${userId} is already exists)`
  }
}

export const updateUserDocument = async (userId: UserId, userData: Partial<Omit<User, 'userId'>>): Promise<WriteResult> => {
  if (!(await isExistsUser(userId))) {
    throw `user(${userId} is not exists)`
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
    throw `user(${userId} is not exists)`
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
    throw `user(${userId} is not exists)`
  }

  return await userCollection
    .doc(userId)
    .delete()
}

export const getUsersInRoom = async (roomId: RoomId): Promise<RoomUser[]> => {
  const roomDoc = await getRoomDocument(roomId)

  if (!roomDoc.exists) {
    throw `room(${roomId} is not exists)`
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