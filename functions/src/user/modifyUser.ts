import * as functions from 'firebase-functions';

import { User, UserId } from '..';
import { getUserDocument, updateUserDocument } from '../lib/user';

export const modifyUser = functions.https.onCall(async (userData: Partial<Omit<User, 'userId'>>, context): Promise<User> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const myUserId = context.auth!.uid as UserId
  const myUserDoc = await getUserDocument(myUserId)

  if (!myUserDoc.exists) {
    throw `user(${myUserId}) is not exists`
  }

  await updateUserDocument(myUserId, userData)

  const updatedUserDoc = await getUserDocument(myUserId)

  return updatedUserDoc.data() as User
})