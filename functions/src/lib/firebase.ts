import * as admin from 'firebase-admin'

import { RoomId } from '..'

const serviceAccount = require("../../younext-firebase-adminsdk.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://younext-c23b6.firebaseio.com',
})

export const COLLECTION_GROUP_USER_NAME = 'users'
export const COLLECTION_GROUP_FOLLOWER_NAME = 'followers'
export const COLLECTION_GROUP_ROOM_NAME = 'rooms'
export const COLLECTION_GROUP_MESSAGE_NAME = 'messages'

export const firestore = admin.firestore()
export const database = admin.database()
export const messaging = admin.messaging()

export const userCollection = firestore.collection(COLLECTION_GROUP_USER_NAME)
export const followerCollection = firestore.collection(COLLECTION_GROUP_FOLLOWER_NAME)
export const roomCollection = firestore.collection(COLLECTION_GROUP_ROOM_NAME)
export const getMessageCollection = (roomId: RoomId) => roomCollection.doc(roomId).collection(COLLECTION_GROUP_MESSAGE_NAME)