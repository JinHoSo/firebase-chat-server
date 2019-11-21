import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { User, UserId } from '..'
import { createUserDocument, getUserDocument } from '../lib/user'

export type RegisterUserData = Pick<User, 'nickname' | 'phoneNumber' | 'locale' | 'avatar' | 'pushToken'>
export type RegisterUserResult = User

export const registerUser = functions.https.onCall(async (userData: RegisterUserData, context): Promise<RegisterUserResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  if (!userData.phoneNumber) {
    throw new HttpsError('invalid-argument', 'phone number is required', {
      phoneNumber: userData.phoneNumber
    })
  }

  if (!userData.nickname) {
    throw new HttpsError('invalid-argument', 'nickname is required', {
      phoneNumber: userData.phoneNumber
    })
  }

  const myUserId = context.auth!.uid as UserId
  await createUserDocument(myUserId, userData)

  const registeredUserDoc = await getUserDocument(myUserId)

  return registeredUserDoc.data() as User
})
