import test from 'node:test'
import assert from 'node:assert/strict'
import { syncCloudWalletForShop } from '../src/components/truthle/RewardShop'

test('cloud sync failure preserves the saved local balance for a retry', async () => {
  let balance = 37
  const result = await syncCloudWalletForShop({
    commerceReady: true,
    syncCloud: async () => {
      balance = 31
      throw new Error('Network unavailable')
    },
    readCoins: () => balance,
  })

  assert.deepEqual(result, { status: 'error', coins: 31 })
})

test('successful cloud sync retry clears the paused state and refreshes the balance', async () => {
  let balance = 37
  let attempt = 0
  const dependencies = {
    commerceReady: true,
    syncCloud: async () => {
      attempt += 1
      if (attempt === 1) throw new Error('Network unavailable')
      balance = 42
      return 5
    },
    readCoins: () => balance,
  }

  assert.deepEqual(await syncCloudWalletForShop(dependencies), {
    status: 'error',
    coins: 37,
  })
  assert.deepEqual(await syncCloudWalletForShop(dependencies), {
    status: 'synced',
    coins: 42,
  })
})

test('a replayed claim receipt applies zero extra coins locally', async () => {
  let balanceReads = 0
  const result = await syncCloudWalletForShop({
    commerceReady: true,
    syncCloud: async () => 0,
    readCoins: () => {
      balanceReads += 1
      return 61
    },
  })

  assert.deepEqual(result, { status: 'synced', coins: 61 })
  assert.equal(balanceReads, 1)
})

test('disabled commerce preserves the saved balance without attempting wallet sync', async () => {
  let syncCalls = 0
  const result = await syncCloudWalletForShop({
    commerceReady: false,
    syncCloud: async () => {
      syncCalls += 1
      return 9
    },
    readCoins: () => 37,
  })

  assert.deepEqual(result, { status: 'disabled', coins: 37 })
  assert.equal(syncCalls, 0)
})
