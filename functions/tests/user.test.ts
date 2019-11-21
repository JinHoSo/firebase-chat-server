import 'jasmine'

import { expect } from 'chai'

import { getMyProfile, getUserProfile, leaveUser, modifyUser, registerUser } from '../src'
import { cleanUserDocument } from '../src/lib/user'
import { GetUserProfileData, GetUserResult } from '../src/user/getUser'
import { LeaveUserResult } from '../src/user/leaveUser'
import { ModifyUserData, ModifyUserResult } from '../src/user/modifyUser'
import { RegisterUserData, RegisterUserResult } from '../src/user/registerUser'
import { testWrap } from './lib/functionTest'

describe('Test for user', () => {
  const smithAuthUid = 'smithAuthUid'
  const markAuthUid = 'markAuthUid'

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
      nickname: 'mark',
      phoneNumber: '821076546511',
      locale: 'en-US'
    }, {
      auth: {
        uid: markAuthUid
      },
    })

    expect(mark.userId).to.not.equal(null)
  })

  it('should get my profile who is Smith', async () => {
    const smith = await testWrap<{}, GetUserResult>(getMyProfile, {}, {
      auth: {
        uid: smithAuthUid
      },
    })

    expect(smith.userId).to.equal(smithAuthUid)
  })

  it('should get an user profile who is Mark', async () => {
    const mark = await testWrap<GetUserProfileData, GetUserResult>(getUserProfile, {
      userId: markAuthUid
    }, {
      auth: {
        uid: smithAuthUid
      },
    })

    expect(mark.userId).to.equal(markAuthUid)
  })

  it('should modify an user', async () => {
    const newNickname = 'Gipson'
    const modifiedUser = await testWrap<ModifyUserData, ModifyUserResult>(modifyUser, {
      nickname: newNickname,
    }, {
      auth: {
        uid: smithAuthUid
      },
    })

    expect(modifiedUser.nickname).to.equal(newNickname)
  })

  it('should leave an user', async () => {
    const leftUserResult = await testWrap<{}, LeaveUserResult>(leaveUser, {}, {
      auth: {
        uid: smithAuthUid
      },
    })

    expect(leftUserResult).to.be.true

    try {
      const smith = await testWrap<{}, GetUserResult>(getMyProfile, {}, {
        auth: {
          uid: smithAuthUid
        },
      })
    }
    catch (e) {
      // console.log(e)
      expect(e).to.be.Throw
    }
  })

  it('should clean up users for test', async () => {
    await cleanUserDocument(smithAuthUid)
    await cleanUserDocument(markAuthUid)

    console.log('clean all tests.')
  })
})