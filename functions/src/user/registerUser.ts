import * as functions from 'firebase-functions';

import { User, UserId } from '..';
import { createUserDocument, getUserDocument } from '../lib/user';

export const registerUser = functions.https.onCall(async (userData: Pick<User, 'nickname' | 'phoneNumber' | 'avatar' | 'pushToken'>, context): Promise<User> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  if(!userData.phoneNumber){
    throw 'phone number is required'
  }

  if(!userData.nickname){
    throw 'nickname is required'
  }

  const myUserId = context.auth!.uid as UserId
  const myUserDoc = await getUserDocument(myUserId)

  if (myUserDoc.exists) {
    throw `userId(${myUserId}) is already exists`
  }

  await createUserDocument(myUserId, userData)

  const registeredUserDoc = await getUserDocument(myUserId)

  if (!registeredUserDoc.exists) {
    throw `failed to register an user(${myUserId})`
  }

  return registeredUserDoc.data() as User
})
