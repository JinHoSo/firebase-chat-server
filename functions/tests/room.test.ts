import 'jasmine';

import { expect } from 'chai';
import * as functionTest from 'firebase-functions-test';

import { createPrivateRoom, GroupRoom, joinRoom, leaveGroupRoom, registerUser, Room } from '../src';
import { cleanRoomDocument } from '../src/lib/room';
import { cleanUserDocument } from '../src/lib/user';
import { createGroupRoom } from '../src/room/createRoom';
import { getRooms, getRoomsAfterRoomId, getRoomsAfterUpdatedAt } from '../src/room/getRoom';
import { inviteGroupRoom } from '../src/room/inviteRoom';
import { getRoomUsers } from '../src/room/roomUser';

const test = functionTest({
  databaseURL: 'https://younext-c23b6.firebaseio.com',
  storageBucket: 'younext-c23b6.appspot.com',
  projectId: 'younext-c23b6',
}, './younext-firebase-adminsdk.json')

describe('cloud functions for user', () => {
  const smithAuthUid = 'smith'
  const markAuthUid = 'mark'
  const alvinAuthUid = 'alvin'
  const kelvinAuthUid = 'kelvin'

  it('should register smith user', async () => {
    const wrapped = test.wrap(registerUser)
    const newUser = await wrapped({
      nickname: 'Smith',
      phoneNumber: '821076546510'
    }, {
      auth: {
        uid: smithAuthUid
      },
    })

    console.log('newUser', newUser)

    expect(newUser).to.not.equal(null)
  })

  it('should register mark user', async () => {
    const wrapped = test.wrap(registerUser)
    const newUser = await wrapped({
      nickname: 'Mark',
      phoneNumber: '821076546511'
    }, {
      auth: {
        uid: markAuthUid
      },
    })

    console.log('newUser', newUser)

    expect(newUser).to.not.equal(null)
  })

  it('should register alvin user', async () => {
    const wrapped = test.wrap(registerUser)
    const newUser = await wrapped({
      nickname: 'Alvin',
      phoneNumber: '821076546512'
    }, {
      auth: {
        uid: alvinAuthUid
      },
    })

    console.log('newUser', newUser)

    expect(newUser).to.not.equal(null)
  })

  it('should register kelvin user', async () => {
    const wrapped = test.wrap(registerUser)
    const newUser = await wrapped({
      nickname: 'Kelvin',
      phoneNumber: '821076546513'
    }, {
      auth: {
        uid: kelvinAuthUid
      },
    })

    console.log('newUser', newUser)

    expect(newUser).to.not.equal(null)
  })

  it('should create smith-mark private room', async () => {
    const wrapped = test.wrap(createPrivateRoom)
    const newPrivateRoom = await wrapped({
      receiverUserId: markAuthUid
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('newPrivateRoom', newPrivateRoom)

    expect(newPrivateRoom).to.not.equal(null)
  })

  it('should create smith-alvin private room', async () => {
    const wrapped = test.wrap(createPrivateRoom)
    const newPrivateRoom = await wrapped({
      receiverUserId: alvinAuthUid
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('newPrivateRoom', newPrivateRoom)

    expect(newPrivateRoom).to.not.equal(null)
  })

  it('should create a group room', async () => {
    const wrapped = test.wrap(createGroupRoom)
    const newGroupRoom = await wrapped({
      receiverUserIds: [markAuthUid, alvinAuthUid]
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('newGroupRoom', newGroupRoom)

    expect(newGroupRoom).to.not.equal(null)
  })

  it('should invite kelvin to group room', async () => {
    const wrapped = test.wrap(getRooms)
    const rooms: Room[] = await wrapped({
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('rooms', rooms)

    const groupRoom = rooms.find(room => (room.userIdArray as string[]).length > 2) as GroupRoom

    console.log('groupRoom', groupRoom)

    const inviteGroupRoomWrapped = test.wrap(inviteGroupRoom)
    const invitedGroupRoom = await inviteGroupRoomWrapped({
      receiverUserId: kelvinAuthUid,
      roomId: groupRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('invitedGroupRoom', invitedGroupRoom)

    expect(invitedGroupRoom.userIdArray.length).to.greaterThan((groupRoom.userIdArray as string[]).length)
  })

  it('should leave kelvin from group room', async () => {
    const wrapped = test.wrap(getRooms)
    const rooms: Room[] = await wrapped({
      pageLimit: 15
    }, {
      auth: {
        uid: kelvinAuthUid
      }
    })

    console.log('rooms', rooms)

    const groupRoom = rooms.find(room => (room.userIdArray as string[]).length > 2) as GroupRoom

    console.log('groupRoom', groupRoom)

    const leaveGroupRoomWrapped = test.wrap(leaveGroupRoom)
    const leftGroupRoomResult: boolean = await leaveGroupRoomWrapped({
      roomId: groupRoom.roomId
    }, {
      auth: {
        uid: kelvinAuthUid
      }
    })

    expect(leftGroupRoomResult).to.be.true
  })

  it('should leave kelvin from group room', async () => {
    const wrapped = test.wrap(getRooms)
    const rooms: Room[] = await wrapped({
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('rooms', rooms)

    const groupRoom = rooms.find(room => (room.userIdArray as string[]).length > 2) as GroupRoom

    console.log('groupRoom', groupRoom)

    const getRoomWrapped = test.wrap(getRoomUsers)
    const roomUsers = await getRoomWrapped({
      roomId: groupRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('roomUsers', roomUsers)

    expect(roomUsers.length).to.be.equal((groupRoom.userIdArray as string[]).length)
  })

  it('should get rooms', async () => {
    const wrapped = test.wrap(getRooms)
    const rooms = await wrapped({
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('rooms', rooms)

    expect(rooms.length).to.greaterThan(0)
  })

  it('should get rooms by room id', async () => {
    const wrapped = test.wrap(getRooms)
    const rooms = await wrapped({
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('rooms', rooms)

    const lastRoom = rooms[rooms.length - 1] as Room

    console.log('lastRoom', lastRoom)

    const getRoomsAfterRoomIdWrapped = test.wrap(getRoomsAfterRoomId)
    const afterRooms = await getRoomsAfterRoomIdWrapped({
      pageLimit: 15,
      afterRoomId: lastRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('afterRooms', afterRooms)

    expect(afterRooms[0].roomId).to.not.equal(lastRoom.roomId)
  })

  it('should get rooms by updated at', async () => {
    const wrapped = test.wrap(getRooms)
    const rooms = await wrapped({
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('rooms', rooms)

    const lastRoom = rooms[rooms.length - 1] as Room

    console.log('lastRoom', lastRoom)

    const getRoomsAfterRoomIdWrapped = test.wrap(getRoomsAfterUpdatedAt)
    const afterRooms = await getRoomsAfterRoomIdWrapped({
      pageLimit: 15,
      updatedAt: lastRoom.updatedAt
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('afterRooms', afterRooms)

    expect(afterRooms[0].roomId).to.not.equal(lastRoom.roomId)
  })

  it('should join room', async () => {
    const wrapped = test.wrap(getRooms)
    const rooms = await wrapped({
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    console.log('rooms', rooms)

    const lastRoom = rooms[rooms.length - 1] as Room

    console.log('lastRoom', lastRoom)

    const joinRoomWrapped = test.wrap(joinRoom)
    const joinedRoomResult = await joinRoomWrapped({
      roomId: lastRoom.roomId
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    expect(joinedRoomResult).to.be.true
  })

  it('should clean up users for test', async () => {
    await cleanUserDocument(smithAuthUid)
    await cleanUserDocument(markAuthUid)
    await cleanUserDocument(alvinAuthUid)
    await cleanUserDocument(kelvinAuthUid)


    const wrapped = test.wrap(getRooms)
    const rooms: Room[] = await wrapped({
      pageLimit: 15
    }, {
      auth: {
        uid: smithAuthUid
      }
    })

    rooms.forEach(async room => await cleanRoomDocument(room.roomId))
  })
})