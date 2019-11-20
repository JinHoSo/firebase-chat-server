import 'jasmine'

import { expect } from 'chai'
import * as functionTest from 'firebase-functions-test'

import { getMyProfile, getUserProfile, leaveUser, modifyUser, registerUser, MediaType } from '../src'
import { cleanUserDocument, getUserDocument } from '../src/lib/user'
import {i18n} from '../src/i18n/i18n'
import {messageMediaToTextGenerator} from '../src/lib/generator/textGenerator'

const test = functionTest({
  databaseURL: 'https://younext-c23b6.firebaseio.com',
  storageBucket: 'younext-c23b6.appspot.com',
  projectId: 'younext-c23b6',
}, './younext-firebase-adminsdk.json')

describe('cloud functions for user', () => {
  const authUid = 'myUid'
  const friendAuthUid = 'friendUid'

  it('should register my user', async () => {
    const wrapped = test.wrap(registerUser)
    const newUser = await wrapped({
      nickname: 'Smith',
      phoneNumber: '821076546510',
      locale:'ko-KR'
    }, {
      auth: {
        uid: authUid
      },
    })

    console.log('newUser', newUser)

    expect(newUser).to.not.equal(null)
  })

  it('should register friend user', async () => {
    const wrapped = test.wrap(registerUser)
    const newUser = await wrapped({
      nickname: 'Mark',
      phoneNumber: '821076546511',
      locale:'en-US'
    }, {
      auth: {
        uid: friendAuthUid
      },
    })

    console.log('newUser', newUser)

    expect(newUser).to.not.equal(null)
  })

  it('should get my profile', async () => {
    const wrapped = test.wrap(getMyProfile)
    const myProfile = await wrapped({
    }, {
      auth: {
        uid: authUid
      },
    })

    console.log('myProfile', myProfile)

    expect(myProfile.userId).to.equal(authUid)
  })

  it('should get user profile', async () => {
    const wrapped = test.wrap(getUserProfile)
    const friendProfile = await wrapped({
      userId: friendAuthUid
    }, {
      auth: {
        uid: authUid
      },
    })

    console.log('friendProfile', friendProfile)

    expect(friendProfile.userId).to.equal(friendAuthUid)
  })

  it('should modify a user', async () => {
    const newNickname = 'Gipson'
    const wrapped = test.wrap(modifyUser)
    const modifiedUser = await wrapped({
      nickname: newNickname,
    }, {
      auth: {
        uid: authUid
      },
    })

    console.log('modifiedUser', modifiedUser)

    expect(modifiedUser.nickname).to.equal(newNickname)
  })

  it('should leave a user', async () => {
    const wrapped = test.wrap(leaveUser)
    await wrapped({}, {
      auth: {
        uid: authUid
      },
    })

    const getUserProfileWrapped = test.wrap(getUserProfile)
    try{
      await getUserProfileWrapped({
        userId: authUid
      }, {
        auth: {
          uid: authUid
        },
      })
    }
    catch(e){
      expect(e).to.be.Throw
    }
  })

  it('should clean up users for test', async () => {
    await cleanUserDocument(authUid)
    await cleanUserDocument(friendAuthUid)

    const user1 = await getUserDocument(authUid)
    const user2 = await getUserDocument(authUid)

    expect(user1.exists).to.equal(false)
    expect(user2.exists).to.equal(false)
  })
})