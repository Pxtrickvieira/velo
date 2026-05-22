import { test as base } from '@playwright/test'

import { createCheckoutActions } from './actions/checkoutActions'
import { createConfiguratorActions } from './actions/configuratorActions'
import { createOrderLookupActions } from './actions/orderLookupActions'
import {
  type CheckoutTestCleanup,
  purgeCheckoutTestOrders,
  teardownCheckoutTestOrders,
} from './database/checkoutTestCleanup'

type App = {
  checkout: ReturnType<typeof createCheckoutActions>
  configurator: ReturnType<typeof createConfiguratorActions>
  orderLookup: ReturnType<typeof createOrderLookupActions>
}

export const test = base.extend<{
  app: App
  checkoutTestCleanup: CheckoutTestCleanup
}>({
  app: async ({ page }, use) => {
    const app: App = {
      checkout: createCheckoutActions(page),
      configurator: createConfiguratorActions(page),
      orderLookup: createOrderLookupActions(page),
    }

    await use(app)
  },

  checkoutTestCleanup: async ({}, use) => {
    const registeredOrderNumbers: string[] = []

    await purgeCheckoutTestOrders()

    await use({
      registerOrderNumber: (orderNumber: string) => {
        registeredOrderNumbers.push(orderNumber)
      },
    })

    await teardownCheckoutTestOrders(registeredOrderNumbers)
  },
})

export { expect } from '@playwright/test'
