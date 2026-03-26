// DEPRECATED: Each service should use its own local prisma.ts
let _client: any = null
export function setDbClient(client: any) { _client = client }
export function getDb(): any { return _client }
export async function connectDb(): Promise<void> { if (_client) await _client.$connect() }
export async function disconnectDb(): Promise<void> { if (_client) await _client.$disconnect() }
export default _client
