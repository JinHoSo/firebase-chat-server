import * as functions from 'firebase-functions'

import { Message } from '..'
import { deleteMessageDocument } from '../lib/message'

export type DeleteMessageData = Pick<Message, 'roomId' | 'messageId'>
export type DeleteMessageResult = true

export const deleteMessage = functions.https.onCall(async (messageData: DeleteMessageData, context): Promise<DeleteMessageResult> => {
  const {
    roomId,
    messageId
  } = messageData

  await deleteMessageDocument(roomId, messageId)

  return true
})