import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/lib/providers/https'

import { UserId } from '..'
import { deleteUserDocument } from '../lib/user'

export type LeaveUserResult = true

export const leaveUser = functions.https.onCall(async (userData, context): Promise<LeaveUserResult> => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'user must be logged in')
  }

  const myUserId = context.auth!.uid as UserId
  await deleteUserDocument(myUserId)

  return true
})
