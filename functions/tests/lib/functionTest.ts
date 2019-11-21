import { CloudFunction } from 'firebase-functions'
import * as functionTest from 'firebase-functions-test'
import { ContextOptions } from 'firebase-functions-test/lib/main'

const test = functionTest({
  databaseURL: 'https://younext-c23b6.firebaseio.com',
  storageBucket: 'younext-c23b6.appspot.com',
  projectId: 'younext-c23b6',
}, '../../younext-firebase-adminsdk.json')

export const testWrap = async <T, U>(cloudFunction: CloudFunction<T>, data: T, options?: ContextOptions): Promise<U> => {
  const testWrappedFunction = test.wrap(cloudFunction)

  return await testWrappedFunction(data, options) as U
}