// Singleton crash game instance — shared by route handler and bootstrap
import { CrashGame } from './crashGame'

export const crashGameInstance = new CrashGame()
