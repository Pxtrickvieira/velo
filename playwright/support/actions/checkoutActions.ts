import { expect, Locator, Page } from '@playwright/test'

export type CheckoutFormData = {
  name?: string
  lastname?: string
  email?: string
  phone?: string
  document?: string
  store?: string
  terms?: boolean
}

const DEFAULT_STORE = 'Velô Paulista - Av. Paulista, 1000'

function parsePrice(price: string): number {
  const digits = price.replace(/[^\d,]/g, '')
  return Number(digits.replace(',', '.'))
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getFinancedSummaryTotal(basePrice: string) {
  return financedTotalsFromBasePrice(basePrice).summaryTotal
}

function financedTotalsFromBasePrice(basePrice: string) {
  const totalPrice = parsePrice(basePrice)
  const installmentValue = (totalPrice / 12) * 1.02
  const totalFinanced = installmentValue * 12

  return {
    installmentLabel: `12x de ${formatPrice(installmentValue)}`,
    summaryTotal: formatPrice(totalFinanced),
  }
}

const VALID_FORM: Required<CheckoutFormData> = {
  name: 'João',
  lastname: 'Silva',
  email: 'cliente@email.com',
  phone: '(11) 98765-4321',
  document: '123.456.789-09',
  store: DEFAULT_STORE,
  terms: true,
}

export type CheckoutSuccessExpectations = {
  statusHeading: string
  statusMessage: string
  statusIcon?: 'check' | 'clock' | 'x'
  totalPrice: string
  customerName: string
  customerEmail: string
  store: string
  orderNumberPattern: RegExp
}

const SUCCESS_STATUS_ICONS = {
  check: 'lucide-circle-check-big',
  clock: 'lucide-clock',
  x: 'lucide-circle-x',
} as const

export function createCheckoutActions(page: Page) {
  const summaryTotalPrice = page.getByTestId('summary-total-price')
  const paymentCashTab = page.getByTestId('payment-avista')
  const paymentFinancedTab = page.getByTestId('payment-financiamento')
  const submitButton = page.getByTestId('checkout-submit')

  const nameInput = page.getByTestId('checkout-name')
  const lastnameInput = page.getByTestId('checkout-lastname')
  const emailInput = page.getByTestId('checkout-email')
  const phoneInput = page.getByTestId('checkout-phone')
  const documentInput = page.getByTestId('checkout-document')
  const storeTrigger = page.getByTestId('checkout-store')
  const termsCheckbox = page.getByTestId('checkout-terms')
 

  const errors = {
    name: page.getByTestId('checkout-error-name'),
    lastname: page.getByTestId('checkout-error-lastname'),
    email: page.getByTestId('checkout-error-email'),
    phone: page.getByTestId('checkout-error-phone'),
    document: page.getByTestId('checkout-error-document'),
    store: page.getByTestId('checkout-error-store'),
    terms: page.getByTestId('checkout-error-terms'),
  }

  return {
    elements: {
      summaryTotalPrice,
      paymentCashTab,
      paymentFinancedTab,
      submitButton,
      nameInput,
      lastnameInput,
      emailInput,
      phoneInput,
      documentInput,
      storeTrigger,
      termsCheckbox,
      errors,
    },

    async openFromConfigurator() {
      await page.goto('/configure')
      await page.getByTestId('checkout-button').click()
      await this.validatePage()
    },

    async open() {
      await page.goto('/order')
      await this.validatePage()
    },

    async validatePage() {
      await expect(page).toHaveURL(/\/order$/)
      await expect(page.getByRole('heading', { name: 'Finalizar Pedido' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Resumo' })).toBeVisible()
      await expect(summaryTotalPrice).toBeVisible()
    },

    async validateSummaryTotalPrice(price: string) {
      await expect(summaryTotalPrice).toHaveText(price)
    },

    async validateOptionalSelected(optionalName: 'Precision Park' | 'Flux Capacitor') {
      await expect(page.locator('li').filter({ hasText: optionalName })).toBeVisible()
    },

    async validateOptionalNotSelected(optionalName: 'Precision Park' | 'Flux Capacitor') {
      await expect(page.locator('li').filter({ hasText: optionalName })).toHaveCount(0)
    },

    async fillForm(data: CheckoutFormData) {
      if (data.name !== undefined) await nameInput.fill(data.name)
      if (data.lastname !== undefined) await lastnameInput.fill(data.lastname)
      if (data.email !== undefined) await emailInput.fill(data.email)
      if (data.phone !== undefined) await phoneInput.fill(data.phone)
      if (data.document !== undefined) await documentInput.fill(data.document)

      if (data.store !== undefined) {
        await storeTrigger.click()
        await page.getByRole('option', { name: data.store }).click()
      }

      if (data.terms !== undefined) {
        if (data.terms) {
          await termsCheckbox.check()
        } else {
          await termsCheckbox.uncheck()
        }
      }
    },

    async fillValidForm(overrides: CheckoutFormData = {}) {
      await this.fillForm({ ...VALID_FORM, ...overrides })
    },

    async selectCashPayment() {
      await paymentCashTab.click()
    },

    async expectCashPaymentTotals(price: string) {
      await expect(paymentCashTab).toContainText('À Vista')
      await expect(paymentCashTab).toContainText(price)
      await expect(summaryTotalPrice).toHaveText(price)
    },

    async selectFinancedPayment() {
      await paymentFinancedTab.click()
    },

    async setEntryValue(value: number) {
      await page.getByTestId('input-entry-value').fill(String(value))
    },

    async expectFinancedPaymentTotals(basePrice: string) {
      const { installmentLabel, summaryTotal } = financedTotalsFromBasePrice(basePrice)

      await expect(paymentFinancedTab).toContainText('Financiamento')
      await expect(paymentFinancedTab).toContainText(installmentLabel)
      await expect(summaryTotalPrice).toHaveText(summaryTotal)
    },

    async expectFormWithoutErrors() {
      for (const errorLocator of Object.values(errors)) {
        await expect(errorLocator).toHaveCount(0)
      }
    },

    async submitOrder() {
      await submitButton.click()
    },

    async expectSubmitProcessing() {
      await expect(submitButton).toContainText('Processando...')
      await expect(submitButton).toBeDisabled()
    },

    async submitOrderAndWaitForSuccess() {
      await submitButton.click()
      await expect(submitButton).toBeDisabled()
      await expect(submitButton).toContainText('Processando...')
      await expect(page).toHaveURL(/\/success$/)
    },

    async getSuccessOrderNumber(): Promise<string> {
      const orderId = page.getByTestId('order-id')
      await expect(orderId).toBeVisible()
      return (await orderId.textContent())?.trim() ?? ''
    },

    async openOrderLookupFromSuccess() {
      await page.getByTestId('goto-consultar').click()
      await expect(page).toHaveURL(/\/lookup$/)
    },

    async expectSuccessPage(expected: CheckoutSuccessExpectations) {
      await expect(page).toHaveURL(/\/success$/)
      await expect(page.getByTestId('success-status')).toHaveText(expected.statusHeading)
      await expect(page.getByTestId('success-status-message')).toHaveText(
        expected.statusMessage
      )

      if (expected.statusIcon) {
        const statusIcon = page.getByTestId('success-status-icon').locator('svg')
        await expect(statusIcon).toHaveClass(
          new RegExp(SUCCESS_STATUS_ICONS[expected.statusIcon])
        )
      }

      await expect(page.getByTestId('order-id')).toHaveText(expected.orderNumberPattern)
      await expect(page.getByText(expected.customerName)).toBeVisible()
      await expect(page.getByText(expected.customerEmail)).toBeVisible()
      await expect(page.getByText(expected.store)).toBeVisible()
      await expect(page.getByText(expected.totalPrice)).toBeVisible()
    },

    async expectStayOnCheckout() {
      await expect(page).toHaveURL(/\/order$/)
    },

    async expectFieldError(field: keyof typeof errors, message: string) {
      await expect(errors[field]).toBeVisible()
      await expect(errors[field]).toHaveText(message)
    },

    async expectAllRequiredFieldErrors() {
      await this.expectFieldError('name', 'Nome deve ter pelo menos 2 caracteres')
      await this.expectFieldError('lastname', 'Sobrenome deve ter pelo menos 2 caracteres')
      await this.expectFieldError('email', 'Email inválido')
      await this.expectFieldError('phone', 'Telefone inválido')
      await this.expectFieldError('document', 'CPF inválido')
      await this.expectFieldError('store', 'Selecione uma loja')
      await this.expectFieldError('terms', 'Aceite os termos')
     
    },
  }
}
