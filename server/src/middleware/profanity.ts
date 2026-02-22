import filter from 'leo-profanity'

filter.loadDictionary()

export function isCleanNickname(name: string): boolean {
  return !filter.check(name)
}
