import { MediaType, MessageMedia } from '../..'
import { i18n } from '../../i18n/i18n'

export const messageMediaToTextGenerator = (messageMedia: MessageMedia, locale: string): string => {
  if (!messageMedia || (messageMedia && !messageMedia.type)) {
    return ''
  }

  if (!locale) {
    locale = i18n.getLocale()
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
      return ''
  }
}