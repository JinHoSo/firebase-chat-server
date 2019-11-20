import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { User, UserId } from '..'
import { getUserDocument, updateUserDocument } from '../lib/user'

export const modifyUser = functions.https.onCall(async (userData: Partial<Omit<User, 'userId'>>, context): Promise<User> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId
  await updateUserDocument(myUserId, userData)
  const updatedUserDoc = await getUserDocument(myUserId)

  return updatedUserDoc.data() as User
})