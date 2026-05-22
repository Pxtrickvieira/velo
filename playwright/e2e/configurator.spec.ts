import { test, expect } from '../support/fixtures'

test.describe('Configuração do Veículo', () => {
  const BASE_PRICE = 'R$ 40.000,00'
  const SPORT_WHEELS_PRICE = 'R$ 42.000,00'
  const PRECISION_PARK_PRICE = 'R$ 45.500,00'
  const PRECISION_PARK_AND_FLUX_CAPACITOR_PRICE = 'R$ 50.500,00'

  test.beforeEach(async ({ app }) => {
    await app.configurator.open()
  })

  test('deve manter o preço e atualizar a imagem ao trocar a cor do veículo', async ({ app }) => {
    await expect(app.configurator.elements.totalPrice).toBeVisible()
    await app.configurator.validateTotalPrice(BASE_PRICE)
    await app.configurator.validateImageVariant(/glacier-blue-aero-wheels/)

    await app.configurator.selectColorMidnightBlack()

    await app.configurator.validateTotalPrice(BASE_PRICE)
    await app.configurator.validateImageVariant(/midnight-black-aero-wheels/)
  })

  test('deve atualizar preço e visual das rodas ao trocar para Sport e retornar para Aero', async ({ app }) => {
    await app.configurator.validateTotalPrice(BASE_PRICE)
    await app.configurator.validateImageVariant(/glacier-blue-aero-wheels/)

    await app.configurator.selectSportWheels()

    await app.configurator.validateTotalPrice(SPORT_WHEELS_PRICE)
    await app.configurator.validateImageVariant(/glacier-blue-sport-wheels/)

    await app.configurator.selectAeroWheels()

    await app.configurator.validateTotalPrice(BASE_PRICE)
    await app.configurator.validateImageVariant(/glacier-blue-aero-wheels/)
  })

  test('deve atualizar preço com opcionais e persistir configuração no checkout', async ({ app }) => {
    await app.configurator.validateTotalPrice(BASE_PRICE)
  
    await app.configurator.selectPrecisionPark()
    await app.configurator.validateTotalPrice(PRECISION_PARK_PRICE)
  
    await app.configurator.selectFluxCapacitor()
    await app.configurator.validateTotalPrice(PRECISION_PARK_AND_FLUX_CAPACITOR_PRICE)
  
    await app.configurator.unselectPrecisionPark()
    await app.configurator.unselectFluxCapacitor()
    await app.configurator.validateTotalPrice(BASE_PRICE)
  
    await app.configurator.finishConfigurator()
  
    await app.checkout.validatePage()
    await app.checkout.validateSummaryTotalPrice(BASE_PRICE)
   
  })
})
