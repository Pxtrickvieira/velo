import { generateOrderCode } from '../helpers'
import type { OrderDetails } from '../actions/orderLookupActions'
import { deleteOrderByNumber, insertOrder } from './orderRepository'

type OrderStatus = 'APROVADO' | 'REPROVADO' | 'EM_ANALISE'

const statusScenarios = {
  APROVADO: {
    color: 'glacier-blue',
    colorLabel: 'Glacier Blue',
    customerName: 'Fernando Papito',
    customerEmail: 'papito@webdojo.com',
  },
  REPROVADO: {
    color: 'midnight-black',
    colorLabel: 'Midnight Black',
    customerName: 'Fernando Papito',
    customerEmail: 'papito@webdojo.com',
  },
  EM_ANALISE: {
    color: 'glacier-blue',
    colorLabel: 'Glacier Blue',
    customerName: 'Lucas Agustinho',
    customerEmail: 'lucasaugustin@gmail.com',
  },
} as const

export async function createLookupOrder(status: OrderStatus): Promise<OrderDetails> {
  const scenario = statusScenarios[status]
  const orderNumber = generateOrderCode()

  const order: OrderDetails = {
    number: orderNumber,
    status,
    color: scenario.colorLabel,
    wheels: 'aero Wheels',
    customer: {
      name: scenario.customerName,
      email: scenario.customerEmail,
      document: '123.456.789-09',
      phone: '(11) 99999-9999',
    },
    payment: 'À Vista',
    total_price: 40000,
  }

  await insertOrder(order)

  return order
}

export async function deleteLookupOrder(orderNumber: string) {
  await deleteOrderByNumber(orderNumber)
}
