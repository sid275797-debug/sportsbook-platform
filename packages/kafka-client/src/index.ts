import { Kafka, Producer, Consumer } from 'kafkajs'
import { createLogger } from '@sportsbook/logger'
import { KafkaTopic, KafkaMessage } from '@sportsbook/shared-types'

const log = createLogger('kafka-client')

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

let kafka: Kafka | null = null
let singletonProducer: Producer | null = null
let producerConnecting: Promise<Producer> | null = null

export function getKafka(): Kafka {
  if (!kafka) {
    kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? process.env.SERVICE_NAME ?? 'sportsbook',
      brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
      retry: { initialRetryTime: 300, retries: 5 },
    })
  }
  return kafka
}

export async function getProducer(): Promise<Producer> {
  if (singletonProducer) return singletonProducer
  if (producerConnecting) return producerConnecting
  producerConnecting = (async () => {
    const producer = getKafka().producer({ allowAutoTopicCreation: true })
    await producer.connect()
    singletonProducer = producer
    producerConnecting = null
    log.info('Kafka singleton producer connected')
    return producer
  })()
  return producerConnecting
}

export async function createProducer(): Promise<Producer> { return getProducer() }

export async function publish<T>(producer: Producer, topic: KafkaTopic, key: string, value: T, correlationId?: string): Promise<void> {
  const message: KafkaMessage<T> = { topic, key, value, timestamp: new Date().toISOString(), correlationId: correlationId ?? generateId() }
  await producer.send({ topic, messages: [{ key, value: JSON.stringify(message) }] })
  log.debug({ topic, key }, 'Message published')
}

export async function createConsumer(groupId: string): Promise<Consumer> {
  const consumer = getKafka().consumer({ groupId: groupId ?? process.env.KAFKA_GROUP_ID ?? 'sportsbook-default' })
  await consumer.connect()
  log.info({ groupId }, 'Kafka consumer connected')
  return consumer
}

export async function subscribe(consumer: Consumer, topics: KafkaTopic[], handler: (message: KafkaMessage) => Promise<void>): Promise<void> {
  await consumer.subscribe({ topics, fromBeginning: false })
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const parsed = JSON.parse(message.value?.toString() ?? '{}') as KafkaMessage
        await handler(parsed)
      } catch (err) { log.error({ err, topic, partition }, 'Failed to process message') }
    },
  })
}

export async function disconnectAll(): Promise<void> {
  if (singletonProducer) { await singletonProducer.disconnect(); singletonProducer = null }
}
