import { MessageMedia, OnlineState, RoomId, User, UserId, UserOnlineStatus } from '..'
import { database, messaging } from './firebase'
import { notificationMessageMediaToTextGenerator, notificationMessageMediaToLocGenerator } from './generator/textGenerator';
import { getRoomData } from './room'
import { getUserDocuments, updateUserDocument } from './user'

export const pushNotification = async (senderUserId: UserId, roomId: RoomId, text?: string, media?: MessageMedia): Promise<void> => {
  const room = await getRoomData(roomId)
  const userDocs = await getUserDocuments(room.userIdArray as UserId[])
  const senderDoc = userDocs.find(user => (user.data() as User).userId === senderUserId)
  const sender = senderDoc!.data() as User
  const receiverDocs = userDocs.filter(user => (user.data() as User).userId !== senderUserId)

  receiverDocs.forEach(receiverDoc => {
    const receiver = receiverDoc.data() as User
    pushNotificationToDevice(sender, receiver, roomId, text, media)
  })
}

export const pushNotificationToDevice = async (sender: User, receiver: User, roomId: RoomId, text?: string, media?: MessageMedia): Promise<void> => {
  const receiverStatusStore = database.ref('/status/' + receiver.userId)
  const receiverStatusSnapshot = await receiverStatusStore.once('value')
  const receiverStatue = receiverStatusSnapshot.val() as UserOnlineStatus
  const isReceiverOnline = receiverStatue && receiverStatue.state === OnlineState.ONLINE ? true : false

  //send push notification
  if (receiver.pushTokens && receiver.pushTokens.length > 0 && !isReceiverOnline) {
    const notification:{[key:string]:string} = {
      title: sender.nickname,
      sound: 'default',
      badge: '1',
    }

    if(media){
      notification['body_loc_key'] = notificationMessageMediaToLocGenerator(media)
    }
    else if(text){
      notification['body'] = text
    }

    const payload = {
      notification: notification,
      data: {
        roomId,
        senderUserId: sender.userId,
        senderUserNickname: sender.nickname,
      },
    }

    const response = await messaging.sendToDevice(receiver.pushTokens, payload)

    let tokensToRemove: string[] = []

    response.results.forEach((result, index) => {
      const error = result.error
      if (error) {
        // console.error('Failure sending notification to', receiver.pushTokens[index], error)
        // Cleanup the tokens who are not registered anymore.
        if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
          tokensToRemove.push(receiver.pushTokens[index])
        }
      }
    })

    if (tokensToRemove.length > 0) {
      const newPushTokens = (receiver.pushTokens as string[]).filter(token => !tokensToRemove.includes(token))
      updateUserDocument(receiver.userId, {
        pushTokens: newPushTokens
      })
    } 
  }
}