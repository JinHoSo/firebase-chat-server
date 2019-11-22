import 'jasmine'

import { expect } from 'chai'

import { createPrivateRoom, Message, registerUser, sendGroupMessage, sendPrivateMessage, UserId, Room } from '../src'
import { cleanRoomDocument } from '../src/lib/room'
import { cleanUserDocument } from '../src/lib/user'
import {
  getMessages,
  getMessagesBeforeCreatedAt,
  GetMessagesBeforeCreatedAtData,
  getMessagesBeforeMessageId,
  GetMessagesBeforeMessageIdData,
  GetMessagesData,
  GetMessagesResult,
} from '../src/message/getMessage'
import {
  SendGroupMessageData,
  SendGroupMessageResult,
  SendPrivateMessageData,
  SendPrivateMessageResult,
} from '../src/message/sendMessage'
import {
  createGroupRoom,
  CreateGroupRoomData,
  CreateGroupRoomResult,
  CreatePrivateRoomData,
  CreatePrivateRoomResult,
} from '../src/room/createRoom'
import { getRooms, GetRoomsData, GetRoomsResult } from '../src/room/getRoom'
import { RegisterUserData, RegisterUserResult } from '../src/user/registerUser'
import { testWrap } from './lib/functionTest'

describe('Test for message', () => {
  const smithAuthUid = 'smith'
  const markAuthUid = 'mark'
  const alvinAuthUid = 'alvin'

  it('should register an user Smith', async () => {
    const smith = await testWrap<RegisterUserData, RegisterUserResult>(registerUser, {
      nickname: 'Smith',
      phoneNumber: '821076546510',
      locale: 'ko-KR'
    }, {
      auth: {
        uid: smithAuthUid
      },
    })

    expect(smith.userId).to.not.equal(null)
  })

  it('should register an user Mark', async () => {
    const mark = await testWrap<RegisterUserData, RegisterUserResult>(registerUser, {
      nickname: 'Mark',
      phoneNumber: '821076546511',
      locale: 'en-US'
    }, {
      auth: {
        uid: markAuthUid
      },
    })

    expect(mark.userId).to.not.equal(null)
  })

  it('should register an user Alvin', async () => {
    const alvin = await testWrap<RegisterUserData, RegisterUserResult>(registerUser, {
      nickname: 'Alvin',
      phoneNumber: '821076546512',
      locale: 'en-US'
    }, {
      auth: {
        uid: alvinAuthUid
      },
    })

    expect(alvin.userId).to.not.equal(null)
  })

  it('should send a message to smith-mark private room', async () => {
    const smithMarkPrivateRoom = await testWrap<CreatePrivateRoomData, CreatePrivateRoomResult>(createPrivateRoom, {
      receiverUserId: markAuthUid
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(smithMarkPrivateRoom.roomId).to.not.equal(null)

    const requestedId = 'requestId'
    const roomId = smithMarkPrivateRoom.roomId
    const receiverUserId = markAuthUid
    const text = 'Hello'

    const sentMessage = await testWrap<SendPrivateMessageData, SendPrivateMessageResult>(sendPrivateMessage, {
      requestedId,
      roomId,
      text
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(sentMessage.roomId).to.equal(roomId)
    expect(sentMessage.requestedId).to.equal(requestedId)
    expect(sentMessage.messageId).to.not.be.undefined
  })

  it('should send a message to group room', async () => {
    const groupRoom = await testWrap<CreateGroupRoomData, CreateGroupRoomResult>(createGroupRoom, {
      receiverUserIds: [markAuthUid, alvinAuthUid]
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const requestedId = 'requestId'
    const roomId = groupRoom.roomId
    const text = 'Hello'

    const sentMessage = await testWrap<SendGroupMessageData, SendGroupMessageResult>(sendGroupMessage, {
      requestedId,
      roomId,
      text
    }, {
      auth: {
        uid: alvinAuthUid
      }
    })

    expect(sentMessage.roomId).to.equal(roomId)
    expect(sentMessage.requestedId).to.equal(requestedId)
    expect(sentMessage.messageId).to.not.be.undefined
  })

  it('should get messages', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: alvinAuthUid
      }
    })

    const room = rooms.find(room => (room.userIdArray as UserId[]).length > 2) as Room

    const requestedId = 'requestId'
    const roomId = room.roomId
    const receiverUserId = markAuthUid

    await testWrap<SendGroupMessageData, SendGroupMessageResult>(sendGroupMessage, {
      requestedId,
      roomId,
      receiverUserId,
      text: 'Hello2'
    }, {
      auth: {
        uid: alvinAuthUid
      }
    })

    await testWrap<SendGroupMessageData, SendGroupMessageResult>(sendGroupMessage, {
      requestedId,
      roomId,
      text: 'Hello3'
    }, {
      auth: {
        uid: markAuthUid
      }
    })

    const messages: Message[] = await testWrap<GetMessagesData, GetMessagesResult>(getMessages, {
      roomId: roomId,
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(messages.length).to.greaterThan(1)
  })

  it('should get messages by message id', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const room = rooms.find(room => (room.userIdArray as UserId[]).length > 2) as Room
    const requestedId = 'requestId'
    const roomId = room.roomId
    const receiverUserId = markAuthUid
    const testText = 'Hi2'

    const sentMessage1 = await testWrap<SendGroupMessageData, SendGroupMessageResult>(sendGroupMessage, {
      requestedId,
      roomId,
      receiverUserId,
      text: testText
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const sentMessage2 = await testWrap<SendGroupMessageData, SendGroupMessageResult>(sendGroupMessage, {
      requestedId,
      roomId,
      text: 'Hi3'
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const messages = await testWrap<GetMessagesBeforeMessageIdData, GetMessagesResult>(getMessagesBeforeMessageId, {
      roomId: roomId,
      afterMessageId: sentMessage2.messageId,
      pageLimit: 1
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(messages[0].messageId).to.equal(sentMessage1.messageId)
  })

  it('should get messages by created at', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const room = rooms.find(room => (room.userIdArray as UserId[]).length > 2) as Room
    const requestedId = 'requestId'
    const roomId = room.roomId
    const receiverUserId = alvinAuthUid
    const testText = 'Hi2'

    const sentMessage1 = await testWrap<SendGroupMessageData, SendGroupMessageResult>(sendGroupMessage, {
      requestedId,
      roomId,
      receiverUserId,
      text: testText
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const sentMessage2 = await testWrap<SendGroupMessageData, SendGroupMessageResult>(sendGroupMessage, {
      requestedId,
      roomId,
      text: 'Hi3'
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const messages = await testWrap<GetMessagesBeforeCreatedAtData, GetMessagesResult>(getMessagesBeforeCreatedAt, {
      roomId: roomId,
      afterCreatedAt: sentMessage2.createdAt,
      pageLimit: 1
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(messages[0].messageId).to.equal(sentMessage1.messageId)
  })

  it('should clean up message for test', async () => {
    await cleanUserDocument(smithAuthUid)
    await cleanUserDocument(markAuthUid)
    await cleanUserDocument(alvinAuthUid)

    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    rooms.forEach(async room => await cleanRoomDocument(room.roomId))

    console.log('clear all tests')
  })

  // it('should smith-mark private room', async () => {
  //   const smithMarkPrivateRoom = await testWrap<CreatePrivateRoomData, CreatePrivateRoomResult>(createPrivateRoom, {
  //     receiverUserId: markAuthUid
  //   }, {
  //     auth: {
  //       uid: smithAuthUid
  //     }
  //   })

  //   expect(smithMarkPrivateRoom.roomId).to.not.equal(null)
  // })

  // it('test sending message time', async () => {
  //   const requestedId = 'requestId'
  //   const roomId = 'wFqvQgTRNN9oM4brVa5tLP'
  //   const receiverUserId = markAuthUid
  //   const text = 'Hello'

  //   const sentMessage = await testWrap<SendPrivateMessageData, SendPrivateMessageResult>(sendPrivateMessage, {
  //     requestedId,
  //     roomId,
  //     text
  //   }, {
  //     auth: {
  //       uid: smithAuthUid
  //     }
  //   })

  //   expect(sentMessage.roomId).to.equal(roomId)
  //   expect(sentMessage.requestedId).to.equal(requestedId)
  //   expect(sentMessage.messageId).to.not.be.undefined
  // })
})