import * as functions from 'firebase-functions'

import { Message } from '..'
import { updateTextMessageDocument } from '../lib/message'

export type UpdateMessageData = Pick<Message, 'roomId' | 'messageId' | 'text'>
export type UpdateMessageResult = true

export const updateTextMessage = functions.https.onCall(async (messageData: UpdateMessageData, context): Promise<UpdateMessageResult> => {
  const {
    roomId,
    messageId,
    text
  } = messageData

  await updateTextMessageDocument(roomId, messageId, text as string)

  return true
})