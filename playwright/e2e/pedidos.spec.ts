import { test } from '../support/fixtures'
import { generateOrderCode } from '../support/helps'
import { OrderDetails } from '../support/actions/orderLookupActions'

test.describe('Consulta de Pedido', () => {
  test.beforeEach(async ({ app }) => {
    await app.orderLookup.open()
  })

  test('Deve consultar um pedido aprovado', async ({ app }) => {
    const order: OrderDetails = {
      number: 'VLO-PA8N0T',
      status: 'APROVADO' as const,
      wheels: 'aero Wheels',
      color: 'Lunar White',
      customer: {
        name: 'Patrick Vieira',
        email: 'patrick.jvc@gmail.com'
      },
      payment: 'À Vista'
    }

    await app.orderLookup.searchOrder(order.number)

    await app.orderLookup.validadeOrderDatails(order)
    await app.orderLookup.validateStatusBadge(order.status)
  })

  test('Deve consultar um pedido reprovado', async ({ app }) => {
    const order: OrderDetails = {
      number: 'VLO-7IKI7U',
      status: 'REPROVADO' as const,
      wheels: 'aero Wheels',
      color: 'Midnight Black',
      customer: {
        name: 'Fernando Papito',
        email: 'papito@webdojo.com'
      },
      payment: 'À Vista'
    }

    await app.orderLookup.searchOrder(order.number)

    await app.orderLookup.validadeOrderDatails(order)
    await app.orderLookup.validateStatusBadge(order.status)
  })

  test('Deve consultar um pedido em analise', async ({ app }) => {
    const order: OrderDetails = {
      number: 'VLO-ZC8CZ5',
      status: 'EM_ANALISE' as const,
      wheels: 'aero Wheels',
      color: 'Glacier Blue',
      customer: {
        name: 'lucas algustinho',
        email: 'lucasaugustin@gmail.com'
      },
      payment: 'À Vista'
    }

    await app.orderLookup.searchOrder(order.number)

    await app.orderLookup.validadeOrderDatails(order)
    await app.orderLookup.validateStatusBadge(order.status)
  })

  test('Deve exibir mensagem quando o pedido não é encontrado', async ({ app }) => {
    const order = generateOrderCode()

    await app.orderLookup.searchOrder(order)
    await app.orderLookup.validadeOrderNotFound()
  })

  test('deve exibir mensagem quando o pedido em qualquer formato não é encontrado', async ({ app }) => {
  
    await app.orderLookup.searchOrder('ABC123')
    await app.orderLookup.validadeOrderNotFound()
  })
})