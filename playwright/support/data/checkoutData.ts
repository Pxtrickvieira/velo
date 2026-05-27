import { type CheckoutFormData } from '../actions/checkoutActions'

import {
  E2E_CHECKOUT_CPF,
  E2E_CHECKOUT_MARKERS,
} from '../database/checkoutTestCleanup'

export const CHECKOUT_DATA = {
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

    reproved: {
      statusHeading: 'Crédito Reprovado',
      statusMessage:
        'Infelizmente seu crédito não foi aprovado. Tente novamente com pagamento à vista.',
      statusIcon: 'x' as const,
      orderNumberPattern: /^VLO-[A-Z0-9]{6}$/,
    },
  },
} as const