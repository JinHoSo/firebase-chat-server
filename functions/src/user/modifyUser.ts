import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { User, UserId } from '..'
import { getUserDocument, updateUserDocument } from '../lib/user'

export type ModifyUserData = Partial<Omit<User, 'userId'>>
export type ModifyUserResult = User

export const modifyUser = functions.https.onCall(async (userData: ModifyUserData, context): Promise<ModifyUserResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId
  await updateUserDocument(myUserId, userData)
  const updatedUserDoc = await getUserDocument(myUserId)

  return updatedUserDoc.data() as User
})