import { MediaType, MessageMedia } from '../..'
import { i18n } from '../../i18n/i18n'

const NOTIFICATION_GOT_IMAGE = 'NOTIFICATION_GOT_IMAGE'
const NOTIFICATION_GOT_VIDEO = 'NOTIFICATION_GOT_VIDEO'
const NOTIFICATION_GOT_VOICE = 'NOTIFICATION_GOT_VOICE'
const NOTIFICATION_GOT_MESSAGE = 'NOTIFICATION_GOT_MESSAGE'

export const notificationMessageMediaToTextGenerator = (messageMedia: MessageMedia, locale?: string): string => {
  if (!locale) {
    locale = i18n.getLocale()
  }

  if (!messageMedia || (messageMedia && !messageMedia.type)) {
    return i18n.__({
      phrase: 'notificationNewMessage',
      locale: locale
    })
  }

  switch (messageMedia.type) {
    case MediaType.IMAGE:
      return i18n.__({
        phrase: 'image',
        locale: locale
      })
    case MediaType.VIDEO:
      return i18n.__({
        phrase: 'video',
        locale: locale
      })
    case MediaType.VOICE:
      return i18n.__({
        phrase: 'voice',
        locale: locale
      })
    default:
      return i18n.__({
        phrase: 'notificationNewMessage',
        locale: locale
      })
  }
}

export const notificationMessageMediaToLocGenerator = (messageMedia: MessageMedia): string => {
  if (!messageMedia || (messageMedia && !messageMedia.type)) {
    return NOTIFICATION_GOT_MESSAGE
  }

  switch (messageMedia.type) {
    case MediaType.IMAGE:
      return NOTIFICATION_GOT_IMAGE
    case MediaType.VIDEO:
      return NOTIFICATION_GOT_VIDEO
    case MediaType.VOICE:
      return NOTIFICATION_GOT_VOICE
    default:
      return NOTIFICATION_GOT_MESSAGE
  }
}