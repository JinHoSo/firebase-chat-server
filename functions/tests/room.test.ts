import 'jasmine'

import { expect } from 'chai'

import { createPrivateRoom, GroupRoom, joinRoom, registerUser, Room, SystemMessage, UserId } from '../src'
import { cleanRoomDocument } from '../src/lib/room'
import { cleanUserDocument } from '../src/lib/user'
import { getMessages, GetMessagesData, GetMessagesResult } from '../src/message/getMessage'
import {
  createGroupRoom,
  CreateGroupRoomData,
  CreateGroupRoomResult,
  CreatePrivateRoomData,
  CreatePrivateRoomResult,
} from '../src/room/createRoom'
import { deleteGroupRoom, DeleteGroupRoomData, DeleteGroupRoomResult } from '../src/room/deleteRoom'
import {
  getRooms,
  getRoomsAfterRoomId,
  GetRoomsAfterRoomIdData,
  getRoomsAfterUpdatedAt,
  GetRoomsAfterUpdatedAtData,
  GetRoomsData,
  GetRoomsResult,
} from '../src/room/getRoom'
import { inviteGroupRoom, InviteGroupRoomData, InviteGroupRoomResult } from '../src/room/inviteRoom'
import { JoinRoomData, JoinRoomResult } from '../src/room/joinRoom'
import { leaveGroupRoom, LeaveGroupRoomData, LeaveGroupRoomResult } from '../src/room/leaveRoom'
import { getRoomUsers, GetRoomUsersData, GetRoomUsersResult } from '../src/room/roomUser'
import { RegisterUserData, RegisterUserResult } from '../src/user/registerUser'
import { testWrap } from './lib/functionTest'

describe('Test for room', () => {
  const smithAuthUid = 'smith'
  const markAuthUid = 'mark'
  const alvinAuthUid = 'alvin'
  const kelvinAuthUid = 'kelvin'

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

  it('should register an user Kelvin', async () => {
    const kelvin = await testWrap<RegisterUserData, RegisterUserResult>(registerUser, {
      nickname: 'Kelvin',
      phoneNumber: '821076546513',
      locale: 'ko-KR'
    }, {
      auth: {
        uid: kelvinAuthUid
      },
    })

    expect(kelvin.userId).to.not.equal(null)
  })

  it('should create smith-mark private room', async () => {
    const smithMarkPrivateRoom = await testWrap<CreatePrivateRoomData, CreatePrivateRoomResult>(createPrivateRoom, {
      receiverUserId: markAuthUid
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(smithMarkPrivateRoom.roomId).to.not.equal(null)
  })

  it('should create smith-alvin private room', async () => {
    const smithAlvinPrivateRoom = await testWrap<CreatePrivateRoomData, CreatePrivateRoomResult>(createPrivateRoom, {
      receiverUserId: alvinAuthUid
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(smithAlvinPrivateRoom.roomId).to.not.equal(null)
  })

  it('should invite kelvin to group room', async () => {
    const groupRoom = await testWrap<CreateGroupRoomData, CreateGroupRoomResult>(createGroupRoom, {
      receiverUserIds: [markAuthUid, alvinAuthUid]
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const invitedGroupRoom = await testWrap<InviteGroupRoomData, InviteGroupRoomResult>(inviteGroupRoom, {
      receiverUserId: kelvinAuthUid,
      roomId: groupRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const messages = await testWrap<GetMessagesData, GetMessagesResult>(getMessages, {
      roomId: groupRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const latestMessage = messages[0] as SystemMessage

    expect(latestMessage).to.not.be.null
    expect((invitedGroupRoom.userIdArray as UserId[]).length).to.greaterThan((groupRoom.userIdArray as UserId[]).length)
  })

  it('should delete kelvin from group room', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: kelvinAuthUid
      }
    })

    //pick group room
    const groupRoom = rooms.find(room => (room.userIdArray as UserId[]).length > 2) as GroupRoom

    const deleteGroupRoomResult = await testWrap<DeleteGroupRoomData, DeleteGroupRoomResult>(deleteGroupRoom, {
      roomId: groupRoom.roomId
    }, {
      auth: {
        uid: kelvinAuthUid
      }
    })

    const messages = await testWrap<GetMessagesData, GetMessagesResult>(getMessages, {
      roomId: groupRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const latestMessage = messages[0] as SystemMessage

    expect(latestMessage.notice).to.not.be.null
    expect(deleteGroupRoomResult).to.be.true
  })

  it('should same user number after deleting kelvin from group room', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const groupRoom = rooms.find(room => (room.userIdArray as string[]).length > 2) as GroupRoom

    const roomUsers = await testWrap<GetRoomUsersData, GetRoomUsersResult>(getRoomUsers, {
      roomId: groupRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(roomUsers.length).to.be.equal((groupRoom.userIdArray as string[]).length)
  })

  it('should get rooms', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(rooms.length).to.greaterThan(0)
  })

  it('should get rooms by room id', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const lastRoom = rooms[rooms.length - 1] as Room

    const afterRooms = await testWrap<GetRoomsAfterRoomIdData, GetRoomsResult>(getRoomsAfterRoomId, {
      pageLimit: 15,
      afterRoomId: lastRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(afterRooms[0].roomId).to.not.equal(lastRoom.roomId)
  })

  it('should get rooms by updated at', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const lastRoom = rooms[rooms.length - 1] as Room

    const afterRooms = await testWrap<GetRoomsAfterUpdatedAtData, GetRoomsResult>(getRoomsAfterUpdatedAt, {
      pageLimit: 15,
      afterUpdatedAt: lastRoom.updatedAt
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(afterRooms[0].roomId).to.not.equal(lastRoom.roomId)
  })

  it('should join room', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const lastRoom = rooms[rooms.length - 1] as Room

    const joinedRoomResult = await testWrap<JoinRoomData, JoinRoomResult>(joinRoom, {
      roomId: lastRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(joinedRoomResult).to.be.true
  })

  it('should leave room', async () => {
    const rooms = await testWrap<GetRoomsData, GetRoomsResult>(getRooms, {
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    const lastRoom = rooms[rooms.length - 1] as Room

    const leftRoomResult = await testWrap<LeaveGroupRoomData, LeaveGroupRoomResult>(leaveGroupRoom, {
      roomId: lastRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(leftRoomResult).to.be.true
  })

  it('should clean up rooms for test', async () => {
    await cleanUserDocument(smithAuthUid)
    await cleanUserDocument(markAuthUid)
    await cleanUserDocument(alvinAuthUid)
    await cleanUserDocument(kelvinAuthUid)

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
})