import { test, expect } from '@playwright/test'
import { generateOrderCode } from '../support/helps'
import { OrderLookupPage } from '../support/pages/OrderLookupPage'

test.describe('Consulta de Pedido', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint')
    await page.getByRole('link', { name: 'Consultar Pedido' }).click()
    await expect(page.getByRole('heading')).toContainText('Consultar Pedido')
  })

  test('Deve consultar um pedido aprovado', async ({ page }) => {
    const order = {
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

    const orderLookupPage = new OrderLookupPage(page)
    await orderLookupPage.searchOrder(order.number)

    await expect(page.getByTestId(`order-result-${order.number}`)).toMatchAriaSnapshot(`
      - img
      - paragraph: Pedido
      - paragraph: ${order.number}
      - status:
        - img
        - text:  ${order.status}
      - img "Velô Sprint"
      - paragraph: Modelo
      - paragraph: Velô Sprint
      - paragraph: Cor
      - paragraph: ${order.color}
      - paragraph: Interior
      - paragraph: cream
      - paragraph: Rodas
      - paragraph: ${order.wheels}
      - heading "Dados do Cliente" [level=4]
      - paragraph: Nome
      - paragraph: ${order.customer.name}
      - paragraph: Email
      - paragraph: ${order.customer.email}
      - paragraph: Loja de Retirada
      - paragraph
      - paragraph: Data do Pedido
      - paragraph: /\\d+\\/\\d+\\/\\d+/
      - heading "Pagamento" [level=4]
      - paragraph: ${order.payment}
      - paragraph: /R\\$ \\d+\\.\\d+,\\d+/
    `)

    await orderLookupPage.validateStatusBadge(order.status)
  })

  test('Deve consultar um pedido reprovado', async ({ page }) => {
    const order = {
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

    const orderLookupPage = new OrderLookupPage(page)
    await orderLookupPage.searchOrder(order.number)

    await expect(page.getByTestId(`order-result-${order.number}`)).toMatchAriaSnapshot(`
      - img
      - paragraph: Pedido
      - paragraph: ${order.number}
      - status:
        - img
        - text:  ${order.status}
      - img "Velô Sprint"
      - paragraph: Modelo
      - paragraph: Velô Sprint
      - paragraph: Cor
      - paragraph: ${order.color}
      - paragraph: Interior
      - paragraph: cream
      - paragraph: Rodas
      - paragraph: ${order.wheels}
      - heading "Dados do Cliente" [level=4]
      - paragraph: Nome
      - paragraph: ${order.customer.name}
      - paragraph: Email
      - paragraph: ${order.customer.email}
      - paragraph: Loja de Retirada
      - paragraph
      - paragraph: Data do Pedido
      - paragraph: /\\d+\\/\\d+\\/\\d+/
      - heading "Pagamento" [level=4]
      - paragraph: ${order.payment}
      - paragraph: /R\\$ \\d+\\.\\d+,\\d+/
    `)

    await orderLookupPage.validateStatusBadge(order.status)
  })

  test('Deve consultar um pedido em analise', async ({ page }) => {
    const order = {
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

    const orderLookupPage = new OrderLookupPage(page)
    await orderLookupPage.searchOrder(order.number)

    await expect(page.getByTestId(`order-result-${order.number}`)).toMatchAriaSnapshot(`
      - img
      - paragraph: Pedido
      - paragraph: ${order.number}
      - status:
        - img
        - text:  ${order.status}
      - img "Velô Sprint"
      - paragraph: Modelo
      - paragraph: Velô Sprint
      - paragraph: Cor
      - paragraph: ${order.color}
      - paragraph: Interior
      - paragraph: cream
      - paragraph: Rodas
      - paragraph: ${order.wheels}
      - heading "Dados do Cliente" [level=4]
      - paragraph: Nome
      - paragraph: ${order.customer.name}
      - paragraph: Email
      - paragraph: ${order.customer.email}
      - paragraph: Loja de Retirada
      - paragraph
      - paragraph: Data do Pedido
      - paragraph: /\\d+\\/\\d+\\/\\d+/
      - heading "Pagamento" [level=4]
      - paragraph: ${order.payment}
      - paragraph: /R\\$ \\d+\\.\\d+,\\d+/
    `)

    await orderLookupPage.validateStatusBadge(order.status)
  })

  test('Deve exibir mensagem quando o pedido não é encontrado', async ({ page }) => {
    const order = generateOrderCode()

    const orderLookupPage = new OrderLookupPage(page)
    await orderLookupPage.searchOrder(order)

    await expect(page.locator('#root')).toMatchAriaSnapshot(`
      - img
      - heading "Pedido não encontrado" [level=3]
      - paragraph: Verifique o número do pedido e tente novamente
    `)
  })
})