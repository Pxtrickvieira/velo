import { test, expect } from '../support/fixtures'
import { getFinancedSummaryTotal, type CheckoutFormData } from '../support/actions/checkoutActions'
import { E2E_CHECKOUT_CPF, E2E_CHECKOUT_MARKERS, } from '../support/database/checkoutTestCleanup'
import { getOrderStatusByNumber } from '../support/database/orderRepository'
import { CHECKOUT_DATA } from '../support/data/checkoutData'

const MEDIUM_SCORE_CPF = E2E_CHECKOUT_MARKERS.cpfMediumScore


const createCheckoutCustomer = (
  overrides: Partial<CheckoutFormData> = {}
): Required<CheckoutFormData> => ({
  ...CHECKOUT_DATA.customer,

  email: `e2e.checkout+${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@velo.test`,

  ...overrides,
})

test.describe('Checkout', () => {

  test.describe('Validações de campos obrigatórios', () => {
    
    test.beforeEach(async ({ app }) => {
      await app.checkout.openFromConfigurator()
    })

    test('deve rejeitar envio com campos obrigatórios vazios', async ({
      app,
    }) => {
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

      await app.checkout.expectFieldError(
        'email',
        'Email inválido'
      )
    })

    test('deve rejeitar CPF incompleto ou inválido', async ({ app }) => {
      await app.checkout.fillValidForm()

      await app.checkout.elements.documentInput.clear()

      await app.checkout.submitOrder()

      await app.checkout.expectStayOnCheckout()

      await app.checkout.expectFieldError(
        'document',
        'CPF inválido'
      )
    })

    test('deve exigir aceite dos termos para concluir o pedido', async ({
      app,
    }) => {
      await app.checkout.fillValidForm({
        terms: false,
      })

      await app.checkout.submitOrder()

      await app.checkout.expectStayOnCheckout()

      await app.checkout.expectFieldError(
        'terms',
        'Aceite os termos'
      )
    })
  })

  test.describe('Pagamento e Confirmação', () => {
    test.beforeEach(async ({ app, checkoutTestCleanup: _cleanup }) => {
      await app.checkout.openFromConfigurator()

      await app.checkout.validateSummaryTotalPrice(
        CHECKOUT_DATA.basePrice
      )
    })

    test('deve concluir pedido à vista com pagamento aprovado', async ({
      app,
      checkoutTestCleanup,
    }) => {
      const customer = createCheckoutCustomer()

      const { basePrice, success } = CHECKOUT_DATA

      await app.checkout.fillForm(customer)

      await app.checkout.expectFormWithoutErrors()

      await app.checkout.selectCashPayment()

      await app.checkout.expectCashPaymentTotals(
        basePrice
      )

      await app.checkout.submitOrderAndWaitForSuccess()

      const orderNumber =
        await app.checkout.getSuccessOrderNumber()

      checkoutTestCleanup.registerOrderNumber(orderNumber)

      await app.checkout.expectSuccessPage({
        ...success.approved,

        totalPrice: basePrice,

        customerName: `${customer.name} ${customer.lastname}`,

        customerEmail: customer.email,

        store: customer.store,
      })
    })

    test('deve aprovar automaticamente o crédito quando o score do CPF for maior que 700 no financiamento', async ({
      app,
      checkoutTestCleanup,
    }) => {
      const customer = createCheckoutCustomer({
        document: E2E_CHECKOUT_MARKERS.cpfHighScore,
      })

      const { basePrice, success } = CHECKOUT_DATA

      await app.checkout.fillForm(customer)

      await app.checkout.expectFormWithoutErrors()

      await app.checkout.selectFinancedPayment()

      await app.checkout.setEntryValue(0)

      await app.checkout.expectFinancedPaymentTotals(
        basePrice
      )

      await app.checkout.submitOrderAndWaitForSuccess()

      const orderNumber =
        await app.checkout.getSuccessOrderNumber()

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
      const customer = createCheckoutCustomer({
        document: MEDIUM_SCORE_CPF,
      })

      const { basePrice, success } = CHECKOUT_DATA

      await app.checkout.fillForm(customer)

      await app.checkout.expectFormWithoutErrors()

      await app.checkout.selectFinancedPayment()

      await app.checkout.setEntryValue(0)

      await app.checkout.expectFinancedPaymentTotals(
        basePrice
      )

      await app.checkout.submitOrderAndWaitForSuccess()

      const orderNumber =
        await app.checkout.getSuccessOrderNumber()

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

      await app.orderLookup.validateStatusBadge(
        'EM_ANALISE'
      )
    })

    test('deve reprovar automaticamente o crédito quando o score do CPF for menor ou igual a 500 no financiamento sem entrada', async ({
      app,
      checkoutTestCleanup,
    }) => {
      const customer = createCheckoutCustomer({
        document: E2E_CHECKOUT_MARKERS.cpfLowScore,
      })

      const { basePrice, success } = CHECKOUT_DATA

      await app.checkout.fillForm(customer)

      await app.checkout.expectFormWithoutErrors()

      await app.checkout.selectFinancedPayment()

      await app.checkout.setEntryValue(0)

      await app.checkout.expectFinancedPaymentTotals(
        basePrice
      )

      await app.checkout.submitOrderAndWaitForSuccess()

      const orderNumber =
        await app.checkout.getSuccessOrderNumber()

      checkoutTestCleanup.registerOrderNumber(orderNumber)

      await app.checkout.expectSuccessPage({
        ...success.reproved,

        totalPrice: getFinancedSummaryTotal(basePrice),

        customerName: `${customer.name} ${customer.lastname}`,

        customerEmail: customer.email,

        store: customer.store,
      })

      await expect
        .poll(() => getOrderStatusByNumber(orderNumber))
        .toBe('REPROVADO')
    })

    test('deve reprovar automaticamente o crédito quando o score do CPF for menor ou igual a 500 no financiamento com entrada menor que 50%', async ({
      app,
      checkoutTestCleanup,
    }) => {
      const customer = createCheckoutCustomer({
        document: E2E_CHECKOUT_MARKERS.cpfLowScore,
      })
    
      const { success } = CHECKOUT_DATA
    
      await app.checkout.fillForm(customer)
    
      await app.checkout.expectFormWithoutErrors()
    
      await app.checkout.selectFinancedPayment()
    
      await app.checkout.setEntryValue(10000)
    
      await app.checkout.expectFinancedPaymentTotals(
        'R$ 30.000,00'
      )
    
      await app.checkout.submitOrderAndWaitForSuccess()
    
      const orderNumber =
        await app.checkout.getSuccessOrderNumber()
    
      checkoutTestCleanup.registerOrderNumber(orderNumber)
    
      await app.checkout.expectSuccessPage({
        ...success.reproved,
    
        totalPrice: 'R$ 40.600,00',
    
        customerName: `${customer.name} ${customer.lastname}`,
    
        customerEmail: customer.email,
    
        store: customer.store,
      })
    
      await expect
        .poll(() => getOrderStatusByNumber(orderNumber))
        .toBe('REPROVADO')
    })

    test('deve aprovar automaticamente o crédito quando o score do CPF for menor ou igual a 500 no financiamento com entrada maior  que 50%', async ({
      app,
      checkoutTestCleanup,
    }) => {
      const customer = createCheckoutCustomer({
        document: E2E_CHECKOUT_MARKERS.cpfLowScore,
      })
    
      const { success } = CHECKOUT_DATA
    
      await app.checkout.fillForm(customer)
    
      await app.checkout.expectFormWithoutErrors()
    
      await app.checkout.selectFinancedPayment()
    
      await app.checkout.setEntryValue(21000)
    
      await app.checkout.expectFinancedPaymentTotals(
        'R$ 19.000,00'
      )
    
      await app.checkout.submitOrderAndWaitForSuccess()
    
      const orderNumber =
        await app.checkout.getSuccessOrderNumber()
    
      checkoutTestCleanup.registerOrderNumber(orderNumber)
    
      await app.checkout.expectSuccessPage({
        ...success.approved,
    
        totalPrice: 'R$ 40.380,00',
    
        customerName: `${customer.name} ${customer.lastname}`,
    
        customerEmail: customer.email,
    
        store: customer.store,
      })
    
      await expect
        .poll(() => getOrderStatusByNumber(orderNumber))
        .toBe('APROVADO')
    })

    test('deve aprovar automaticamente o crédito quando o score do CPF for menor ou igual a 500 no financiamento com entrada igual a 50%', async ({
      app,
      checkoutTestCleanup,
    }) => {
      const customer = createCheckoutCustomer({
        document: E2E_CHECKOUT_MARKERS.cpfLowScore,
      })
    
      const { success } = CHECKOUT_DATA
    
      await app.checkout.fillForm(customer)
    
      await app.checkout.expectFormWithoutErrors()
    
      await app.checkout.selectFinancedPayment()
    
      await app.checkout.setEntryValue(20000)
    
      await app.checkout.expectFinancedPaymentTotals(
        'R$ 20.000,00'
      )
    
      await app.checkout.submitOrderAndWaitForSuccess()
    
      const orderNumber =
        await app.checkout.getSuccessOrderNumber()
    
      checkoutTestCleanup.registerOrderNumber(orderNumber)
    
      await app.checkout.expectSuccessPage({
        ...success.approved,
    
        totalPrice: 'R$ 40.400,00',
    
        customerName: `${customer.name} ${customer.lastname}`,
    
        customerEmail: customer.email,
    
        store: customer.store,
      })
    
      await expect
        .poll(() => getOrderStatusByNumber(orderNumber))
        .toBe('APROVADO')
    })  
  })
})