import * as functions from 'firebase-functions';

import { UserId } from '..';
import { deleteUserDocument, getUserDocument } from '../lib/user';

export const leaveUser = functions.https.onCall(async (data, context): Promise<void> => {
  if (!context.auth) {
    throw 'user must be logged in'
  }

  const myUserId = context.auth!.uid as UserId
  const myUserDoc = await getUserDocument(myUserId)

  if (!myUserDoc.exists) {
    throw `user(${myUserId}) is not exists`
  }

  await deleteUserDocument(myUserId)
})
