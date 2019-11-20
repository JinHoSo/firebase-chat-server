import * as i18n from 'i18n'

i18n.configure({
  locales: ['en-US', 'ko-KR'],
  directory: __dirname + '/locales',
  defaultLocale: 'en-US',
})

export { i18n }