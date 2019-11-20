import * as functions from 'firebase-functions'

import { Message } from '..'
import { deleteMessageDocument } from '../lib/message'

type DeleteMessageArguments = Pick<Message, 'roomId' | 'messageId'>

export const deleteMessage = functions.https.onCall(async (messageData: DeleteMessageArguments, context): Promise<true> => {
  const {
    roomId,
    messageId
  } = messageData

  await deleteMessageDocument(roomId, messageId)

  return true
})