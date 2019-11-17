import * as functions from 'firebase-functions';

import { User, UserId } from '..';
import { getUserDocument } from '../lib/user';

export const getMyProfile = functions.https.onCall(async (data, context): Promise<User> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const myUserId = context.auth!.uid as UserId
  const myUserDoc = await getUserDocument(myUserId)

  if (!myUserDoc.exists) {
    throw `user(${myUserId}) is not exists`
  }

  const myProfileData = myUserDoc.data() as User

  if(myProfileData.leftAt){
    throw `user(${myUserId}) is already left`
  }

  return myProfileData
})

export const getUserProfile = functions.https.onCall(async (userData: Pick<User, 'userId'>, context): Promise<User> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const {userId} = userData
  const userDoc = await getUserDocument(userId)

  if (!userDoc.exists) {
    throw `user(${userId}) is not exists`
  }

  const userProfileData = userDoc.data() as User

  if(userProfileData.leftAt){
    throw `user(${userId}) is already left`
  }

  return userProfileData
})