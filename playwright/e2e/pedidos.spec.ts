import { test, expect } from '@playwright/test'
import { generateOrderCode } from '../support/helps'
import { beforeEach } from 'node:test'

/// AAA - Arrange, Act, Assert

test.describe('Consulta de Pedido', () => {

    test.beforeEach(async ({page}) => {

        await page.goto('http://localhost:5173/')
        await expect(page.getByTestId('hero-section').getByRole('heading')).toContainText('Velô Sprint')
        await page.getByRole('link', { name: 'Consultar Pedido' }).click()
        await expect(page.getByRole('heading')).toContainText('Consultar Pedido')

    })

    test('Deve consultar um pedido aprovado', async ({ page }) => {

        const order = 'VLO-PA8N0T'
        
        //Act
        await page.getByRole('textbox', { name: 'Número do Pedido' }).fill(order)
        await page.getByRole('button', { name: 'Buscar Pedido' }).click()

        //Assert
        await expect(page.getByText(order)).toBeVisible()
        await expect(page.getByTestId('order-result-VLO-PA8N0T')).toContainText(order)

        await expect(page.getByText('APROVADO')).toBeVisible()
        await expect(page.getByTestId('order-result-VLO-PA8N0T')).toContainText('APROVADO')
    })

    test('deve exibir mensagem quando o pedido não é encontrado', async ({ page }) => {

        const order = generateOrderCode()

        //Act
        await page.getByRole('textbox', { name: 'Número do Pedido' }).fill(order)
        await page.getByRole('button', { name: 'Buscar Pedido' }).click()

        await expect(page.locator('#root')).toMatchAriaSnapshot(`
            - img
            - heading "Pedido não encontrado" [level=3]
            - paragraph: Verifique o número do pedido e tente novamente
          `)
    })
})