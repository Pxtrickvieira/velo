import { expect, Page } from '@playwright/test'

export function createConfiguratorActions(page: Page) {
  const totalPrice = page.getByTestId('total-price')
  const carExteriorImage = page.getByTestId('car-exterior-image')
  const midnightBlackColor = page.getByRole('button', { name: 'Midnight Black' })
  const sportWheels = page.getByRole('button', { name: /Sport Wheels/ })
  const aeroWheels = page.getByRole('button', { name: /Aero Wheels/ })
  const precisionPark = page.getByTestId('opt-precision-park')
  const fluxCapacitor = page.getByTestId('opt-flux-capacitor')
  const checkoutButton = page.getByTestId('checkout-button')

  return {
    elements: {
      totalPrice,
      carExteriorImage,
      midnightBlackColor,
      sportWheels,
      aeroWheels,
      precisionPark,
      fluxCapacitor,
      checkoutButton,
    },

    async open() {
      await page.goto('/configure')
    },

    async selectColorMidnightBlack() {
      await midnightBlackColor.click()
    },

    async selectSportWheels() {
      await sportWheels.click()
    },

    async selectAeroWheels() {
      await aeroWheels.click()
    },

    async selectPrecisionPark() {
      await precisionPark.check()
    },

    async selectFluxCapacitor() {
      await fluxCapacitor.check()
    },

    async unselectPrecisionPark() {
      await precisionPark.uncheck()
    },

    async unselectFluxCapacitor() {
      await fluxCapacitor.uncheck()
    },

    async validateTotalPrice(price: string) {
      await expect(totalPrice).toHaveText(price)
    },

    async validateImageVariant(variant: RegExp) {
      await expect(carExteriorImage).toHaveAttribute('src', variant)
    },
    
    async finishConfigurator() {
      await checkoutButton.click()
    },
  }
}
