import { db } from './database'
import { OrderTable } from './schema'
import { OrderDetails } from '../actions/orderLookupActions'
import { randomUUID } from 'node:crypto'

export function normalizeValue(value: string) {
  if (!value) return '';

  return value
    .normalize('NFD') // separa acentos
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/\s+/g, '') // remove espaços
    .toLowerCase(); // lowercase
}

export async function insertOrder(order: OrderDetails) {

  const data: OrderTable = {
    id: randomUUID(),
    order_number: order.number,
    color: order.color.toLowerCase().replace(' ','-'),//'glacier-blue',
    wheel_type: order.wheels.replace(' Wheels','').toLocaleLowerCase(),
    customer_name: order.customer.name,
    customer_email: order.customer.email,
    customer_phone: order.customer.phone,
    customer_cpf:order.customer.document,
    payment_method: normalizeValue(order.payment),
    total_price: order.total_price,
    status: order.status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    optionals: [],
  }

  await db.insertInto('orders').values(data).execute()
}

export async function deleteOrderByNumber(orderNumber: string) {
  await db.deleteFrom('orders').where('order_number', '=', orderNumber).execute()
}

export async function getOrderStatusByNumber(
  orderNumber: string
): Promise<OrderTable['status'] | undefined> {
  const row = await db
    .selectFrom('orders')
    .select('status')
    .where('order_number', '=', orderNumber)
    .executeTakeFirst()

  return row?.status
}

export async function deleteOrdersByCustomerEmail(email: string) {
  await db.deleteFrom('orders').where('customer_email', '=', email).execute()
}

export async function deleteOrdersByCustomerCpf(cpf: string) {
  await db.deleteFrom('orders').where('customer_cpf', '=', cpf).execute()
}

export async function purgeOrdersByTestCustomer(email: string, cpf: string) {
  await deleteOrdersByCustomerEmail(email)
  await deleteOrdersByCustomerCpf(cpf)
}
