import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateInstallment,
  calculateTotalPrice,
  formatPrice,
  useConfiguratorStore,
  type CarConfiguration,
  type Order,
} from './configuratorStore';

const defaultConfiguration: CarConfiguration = {
  exteriorColor: 'glacier-blue',
  interiorColor: 'carbon-black',
  wheelType: 'aero',
  optionals: [],
};

const createOrder = (email: string, id = 'order-1'): Order => ({
  id,
  configuration: defaultConfiguration,
  totalPrice: 40000,
  customer: {
    name: 'João',
    surname: 'Silva',
    email,
    phone: '11999999999',
    cpf: '12345678901',
    store: 'Loja Centro',
  },
  paymentMethod: 'avista',
  status: 'APROVADO',
  createdAt: '2026-05-27T10:00:00.000Z',
});

const resetStore = () => {
  useConfiguratorStore.setState({
    configuration: { ...defaultConfiguration },
    viewMode: 'exterior',
    orders: [],
    currentUserEmail: null,
  });
};

describe('calculateTotalPrice', () => {
  it('retorna o preço base para configuração padrão', () => {
    expect(calculateTotalPrice(defaultConfiguration)).toBe(40000);
  });

  it('adiciona o valor das rodas sport', () => {
    const config: CarConfiguration = { ...defaultConfiguration, wheelType: 'sport' };
    expect(calculateTotalPrice(config)).toBe(42000);
  });

  it('soma opcionais válidos', () => {
    const config: CarConfiguration = {
      ...defaultConfiguration,
      optionals: ['precision-park', 'flux-capacitor'],
    };
    expect(calculateTotalPrice(config)).toBe(50500);
  });
});

describe('calculateInstallment', () => {
  it('calcula a parcela com juros compostos de 12x', () => {
    const total = 40000;
    const monthlyRate = 0.02;
    const months = 12;
    const expected =
      (total * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);
    const rounded = Math.round(expected * 100) / 100;

    expect(calculateInstallment(total)).toBe(rounded);
  });
});

describe('formatPrice', () => {
  it('formata valor em BRL (pt-BR)', () => {
    expect(formatPrice(1234.56)).toMatch(/R\$\s?1\.234,56/);
  });
});

describe('useConfiguratorStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('estado inicial', () => {
    it('inicia com configuração padrão e sem usuário logado', () => {
      const state = useConfiguratorStore.getState();

      expect(state.configuration).toEqual(defaultConfiguration);
      expect(state.viewMode).toBe('exterior');
      expect(state.orders).toEqual([]);
      expect(state.currentUserEmail).toBeNull();
    });
  });

  describe('configuração do carro', () => {
    it('setExteriorColor atualiza cor e viewMode', () => {
      useConfiguratorStore.getState().setExteriorColor('midnight-black');

      const { configuration, viewMode } = useConfiguratorStore.getState();
      expect(configuration.exteriorColor).toBe('midnight-black');
      expect(viewMode).toBe('exterior');
    });

    it('setInteriorColor atualiza cor e viewMode', () => {
      useConfiguratorStore.getState().setInteriorColor('deep-blue');

      const { configuration, viewMode } = useConfiguratorStore.getState();
      expect(configuration.interiorColor).toBe('deep-blue');
      expect(viewMode).toBe('interior');
    });

    it('setWheelType atualiza tipo de roda', () => {
      useConfiguratorStore.getState().setWheelType('sport');

      expect(useConfiguratorStore.getState().configuration.wheelType).toBe('sport');
    });

    it('toggleOptional adiciona e remove opcional', () => {
      const { toggleOptional } = useConfiguratorStore.getState();

      toggleOptional('precision-park');
      expect(useConfiguratorStore.getState().configuration.optionals).toEqual([
        'precision-park',
      ]);

      toggleOptional('precision-park');
      expect(useConfiguratorStore.getState().configuration.optionals).toEqual([]);
    });

    it('setViewMode altera o modo de visualização', () => {
      useConfiguratorStore.getState().setViewMode('interior');
      expect(useConfiguratorStore.getState().viewMode).toBe('interior');
    });

    it('resetConfiguration restaura valores padrão', () => {
      const store = useConfiguratorStore.getState();
      store.setExteriorColor('midnight-black');
      store.setWheelType('sport');
      store.toggleOptional('flux-capacitor');
      store.resetConfiguration();

      expect(useConfiguratorStore.getState().configuration).toEqual(defaultConfiguration);
    });
  });

  describe('pedidos e autenticação', () => {
    const email = 'cliente@exemplo.com';

    it('addOrder adiciona pedido à lista', () => {
      const order = createOrder(email);
      useConfiguratorStore.getState().addOrder(order);

      expect(useConfiguratorStore.getState().orders).toHaveLength(1);
      expect(useConfiguratorStore.getState().orders[0]).toEqual(order);
    });

    it('login retorna true quando há pedidos do email', () => {
      useConfiguratorStore.getState().addOrder(createOrder(email));

      const success = useConfiguratorStore.getState().login(email);

      expect(success).toBe(true);
      expect(useConfiguratorStore.getState().currentUserEmail).toBe(email);
    });

    it('login retorna false quando não há pedidos do email', () => {
      const success = useConfiguratorStore.getState().login('outro@exemplo.com');

      expect(success).toBe(false);
      expect(useConfiguratorStore.getState().currentUserEmail).toBeNull();
    });

    it('logout limpa o usuário logado', () => {
      useConfiguratorStore.getState().addOrder(createOrder(email));
      useConfiguratorStore.getState().login(email);
      useConfiguratorStore.getState().logout();

      expect(useConfiguratorStore.getState().currentUserEmail).toBeNull();
    });

    it('getUserOrders retorna pedidos do usuário logado', () => {
      useConfiguratorStore.getState().addOrder(createOrder(email, 'order-1'));
      useConfiguratorStore.getState().addOrder(createOrder('outro@exemplo.com', 'order-2'));
      useConfiguratorStore.getState().login(email);

      const userOrders = useConfiguratorStore.getState().getUserOrders();

      expect(userOrders).toHaveLength(1);
      expect(userOrders[0].customer.email).toBe(email);
    });

    it('getUserOrders retorna lista vazia sem usuário logado', () => {
      useConfiguratorStore.getState().addOrder(createOrder(email));

      expect(useConfiguratorStore.getState().getUserOrders()).toEqual([]);
    });
  });
});
