import '@testing-library/jest-dom'

// Mock pour les dates si nécessaire
// Permet de tester avec des dates fixes
export function mockDate(date: Date) {
  const originalDate = global.Date
  
  const MockDate = class extends originalDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(date.getTime())
      } else {
        // @ts-ignore
        super(...args)
      }
    }
    
    static now() {
      return date.getTime()
    }
  }
  
  global.Date = MockDate as any
  
  return () => {
    global.Date = originalDate
  }
}



