import {
  deleteOrderByNumber,
  purgeOrdersByTestCustomer,
} from './orderRepository'

/** Marcadores exclusivos de E2E — não usar em dados reais. */
export const E2E_CHECKOUT_MARKERS = {
  email: 'e2e.checkout@velo.test',
  /** CPF com score > 700 no mock de crédito (ver credit-analysis). */
  cpfHighScore: '529.982.247-25',
  /** CPF com score 501–700 no mock de crédito. */
  cpfMediumScore: '390.533.447-05',
  /** CPF com score <= 500 no mock de crédito. */
  cpfLowScore: '123.456.789-09',
} as const

/** CPF padrão dos testes de checkout (score alto). */
export const E2E_CHECKOUT_CPF = E2E_CHECKOUT_MARKERS.cpfHighScore

export type CheckoutTestCleanup = {
  registerOrderNumber: (orderNumber: string) => void
}

export async function purgeCheckoutTestOrders() {
  await purgeOrdersByTestCustomer(
    E2E_CHECKOUT_MARKERS.email,
    E2E_CHECKOUT_CPF
  )
}

export async function teardownCheckoutTestOrders(
  registeredOrderNumbers: readonly string[]
) {
  for (const orderNumber of registeredOrderNumbers) {
    try {
      await deleteOrderByNumber(orderNumber)
    } catch (error) {
      console.warn(`[e2e] Falha ao remover pedido ${orderNumber}:`, error)
    }
  }

  try {
    await purgeCheckoutTestOrders()
  } catch (error) {
    console.warn('[e2e] Falha na limpeza por marcadores de teste:', error)
  }
}
