import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { User, UserId } from '..'
import { getUserDocument } from '../lib/user'

export type GetUserProfileData = Pick<User, 'userId'>
export type GetUserResult = User

export const getMyProfile = functions.https.onCall(async (userData, context): Promise<GetUserResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId
  const myUserDoc = await getUserDocument(myUserId)
  const myProfileData = myUserDoc.data() as User

  return myProfileData
})

export const getUserProfile = functions.https.onCall(async (userData: GetUserProfileData, context): Promise<GetUserResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const { userId } = userData
  const userDoc = await getUserDocument(userId)
  const userProfileData = userDoc.data() as User

  return userProfileData
})