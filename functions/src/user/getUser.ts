import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { User, UserId } from '..'
import { getUserDocument } from '../lib/user'

export const getMyProfile = functions.https.onCall(async (userData, context): Promise<User> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId
  const myUserDoc = await getUserDocument(myUserId)
  const myProfileData = myUserDoc.data() as User

  return myProfileData
})

export const getUserProfile = functions.https.onCall(async (userData: Pick<User, 'userId'>, context): Promise<User> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const { userId } = userData
  const userDoc = await getUserDocument(userId)
  const userProfileData = userDoc.data() as User

  return userProfileData
})