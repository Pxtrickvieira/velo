import { test, expect } from '../support/fixtures'
import {
  getFinancedSummaryTotal,
  type CheckoutFormData,
} from '../support/actions/checkoutActions'
import {
  E2E_CHECKOUT_CPF,
  E2E_CHECKOUT_MARKERS,
} from '../support/database/checkoutTestCleanup'
import { getOrderStatusByNumber } from '../support/database/orderRepository'

/** Score 600 no mock da edge function `credit-analysis` (faixa 501–700, CT07). */
const MEDIUM_SCORE_CPF = E2E_CHECKOUT_MARKERS.cpfMediumScore

const CHECKOUT_DATA = {
  basePrice: 'R$ 40.000,00',

  customer: {
    name: 'Maria',
    lastname: 'Oliveira',
    email: E2E_CHECKOUT_MARKERS.email,
    phone: '(11) 97654-3210',
    document: E2E_CHECKOUT_CPF,
    store: 'Velô Paulista - Av. Paulista, 1000',
    terms: true,
  } satisfies Required<CheckoutFormData>,

  success: {
    approved: {
      statusHeading: 'Pedido Aprovado!',
      statusMessage:
        'Seu pedido foi processado com sucesso. Em breve entraremos em contato.',
      statusIcon: 'check' as const,
      orderNumberPattern: /^VLO-[A-Z0-9]{6}$/,
    },
    inAnalysis: {
      statusHeading: 'Pedido em Análise',
      statusMessage:
        'Seu pedido foi registrado e está em análise de crédito. Entraremos em contato em breve com o resultado.',
      statusIcon: 'clock' as const,
      orderNumberPattern: /^VLO-[A-Z0-9]{6}$/,
    },
  },
} as const

test.describe('Checkout', () => {
  test.describe('Validações de campos obrigatórios', () => {
    test.beforeEach(async ({ app }) => {
      await app.checkout.openFromConfigurator()
    })

    test('deve rejeitar envio com campos obrigatórios vazios', async ({ app }) => {
      await app.checkout.submitOrder()

      await app.checkout.expectStayOnCheckout()
      await app.checkout.expectAllRequiredFieldErrors()
    })

    test('deve rejeitar nome e sobrenome com menos de 2 caracteres', async ({
      app,
    }) => {
      await app.checkout.fillValidForm()
      await app.checkout.fillForm({
        name: 'A',
        lastname: 'B',
      })

      await app.checkout.submitOrder()

      await app.checkout.expectStayOnCheckout()
      await app.checkout.expectFieldError(
        'name',
        'Nome deve ter pelo menos 2 caracteres'
      )
      await app.checkout.expectFieldError(
        'lastname',
        'Sobrenome deve ter pelo menos 2 caracteres'
      )
    })

    test('deve rejeitar e-mail em formato inválido', async ({ app }) => {
      await app.checkout.fillValidForm({
        email: 'cliente@.com',
      })

      await app.checkout.submitOrder()

      await app.checkout.expectStayOnCheckout()
      await app.checkout.expectFieldError('email', 'Email inválido')
    })

    test('deve rejeitar CPF incompleto ou inválido', async ({ app }) => {
      await app.checkout.fillValidForm()
      await app.checkout.elements.documentInput.clear()

      await app.checkout.submitOrder()

      await app.checkout.expectStayOnCheckout()
      await app.checkout.expectFieldError('document', 'CPF inválido')
    })

    test('deve exigir aceite dos termos para concluir o pedido', async ({
      app,
    }) => {
      await app.checkout.fillValidForm({
        terms: false,
      })

      await app.checkout.submitOrder()

      await app.checkout.expectStayOnCheckout()
      await app.checkout.expectFieldError('terms', 'Aceite os termos')
    })
  })

  test.describe('Pagamento e Confirmação', () => {
    test.beforeEach(async ({ app, checkoutTestCleanup: _cleanup }) => {
      await app.checkout.openFromConfigurator()
      await app.checkout.validateSummaryTotalPrice(CHECKOUT_DATA.basePrice)
    })

    test('deve concluir pedido à vista com pagamento aprovado', async ({
      app,
      checkoutTestCleanup,
    }) => {
      const { customer, basePrice, success } = CHECKOUT_DATA

      await app.checkout.fillForm(customer)
      await app.checkout.expectFormWithoutErrors()

      await app.checkout.selectCashPayment()
      await app.checkout.expectCashPaymentTotals(basePrice)

      await app.checkout.submitOrderAndWaitForSuccess()

      const orderNumber = await app.checkout.getSuccessOrderNumber()
      checkoutTestCleanup.registerOrderNumber(orderNumber)

      await app.checkout.expectSuccessPage({
        ...success.approved,
        totalPrice: basePrice,
        customerName: `${customer.name} ${customer.lastname}`,
        customerEmail: customer.email,
        store: customer.store,
      })
    })

    test('deve aprovar automaticamente o crédito quando o score do CPF for maior que 700 no financiamento', async ({app, checkoutTestCleanup}) => {
      const { customer, basePrice, success } = CHECKOUT_DATA

      await app.checkout.fillForm({
        ...customer,
        document: E2E_CHECKOUT_MARKERS.cpfHighScore,
      })
      await app.checkout.expectFormWithoutErrors()

      await app.checkout.selectFinancedPayment()
      await app.checkout.setEntryValue(0)
      await app.checkout.expectFinancedPaymentTotals(basePrice)

      await app.checkout.submitOrderAndWaitForSuccess()

      const orderNumber = await app.checkout.getSuccessOrderNumber()
      checkoutTestCleanup.registerOrderNumber(orderNumber)

      await app.checkout.expectSuccessPage({
        ...success.approved,
        totalPrice: getFinancedSummaryTotal(basePrice),
        customerName: `${customer.name} ${customer.lastname}`,
        customerEmail: customer.email,
        store: customer.store,
      })

      await expect
        .poll(() => getOrderStatusByNumber(orderNumber))
        .toBe('APROVADO')
    })

    test('deve registrar pedido em análise manual quando o score do CPF estiver entre 501 e 700 no financiamento', async ({
      app,
      checkoutTestCleanup,
    }) => {
      const { customer, basePrice, success } = CHECKOUT_DATA

      await app.checkout.fillForm({
        ...customer,
        document: MEDIUM_SCORE_CPF,
      })
      await app.checkout.expectFormWithoutErrors()

      await app.checkout.selectFinancedPayment()
      await app.checkout.setEntryValue(0)
      await app.checkout.expectFinancedPaymentTotals(basePrice)

      await app.checkout.submitOrderAndWaitForSuccess()

      const orderNumber = await app.checkout.getSuccessOrderNumber()
      checkoutTestCleanup.registerOrderNumber(orderNumber)

      await app.checkout.expectSuccessPage({
        ...success.inAnalysis,
        totalPrice: getFinancedSummaryTotal(basePrice),
        customerName: `${customer.name} ${customer.lastname}`,
        customerEmail: customer.email,
        store: customer.store,
      })

      await expect
        .poll(() => getOrderStatusByNumber(orderNumber))
        .toBe('EM_ANALISE')

      await app.checkout.openOrderLookupFromSuccess()
      await app.orderLookup.searchOrder(orderNumber)
      await app.orderLookup.validateStatusBadge('EM_ANALISE')
    })
  })
})