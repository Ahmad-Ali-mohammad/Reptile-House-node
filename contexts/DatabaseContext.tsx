import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Reptile, Order, Address, User, Article, HeroSlide, Supply } from '../types';
import { api, ApiError } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface DatabaseContextType {
  products: Reptile[];
  orders: Order[];
  addresses: Address[];
  users: User[];
  articles: Article[];
  heroSlides: HeroSlide[];
  supplies: Supply[];
  loading: boolean;
  backendAvailable: boolean;
  dataSource: 'api';
  addProduct: (product: Reptile) => void;
  deleteProduct: (id: number) => void;
  addAddress: (address: Address) => void;
  removeAddress: (id: number) => void;
  createOrder: (order: Order) => Promise<Order | null>;
  updateOrder: (id: string, status: Order['status']) => void;
  deleteOrder: (id: string) => void;
  updateOrderPaymentStatus: (orderId: string, paymentStatus: Order['paymentVerificationStatus'], rejectionReason?: string, nextStatus?: Order['status'], paidAmount?: number) => void;
  addArticle: (article: Article) => void;
  deleteArticle: (id: number) => void;
  saveHeroSlide: (slide: HeroSlide) => void;
  deleteHeroSlide: (id: string) => void;
  updateUser: (user: User) => void;
  deleteUser: (id: string) => void;
  addSupply: (supply: Supply) => void;
  deleteSupply: (id: number) => void;
  refreshData: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Reptile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const refreshControllerRef = useRef<AbortController | null>(null);

  const isAbortApiError = (error: unknown): boolean => error instanceof ApiError && error.isAbortError;
  const isUnauthorizedApiError = (error: unknown): boolean => error instanceof ApiError && error.status === 401;

  const readArrayResult = <T,>(label: string, result: PromiseSettledResult<T[]>) => {
    if (result.status === 'fulfilled') {
      return Array.isArray(result.value) ? result.value : [];
    }

    if (!isAbortApiError(result.reason) && !isUnauthorizedApiError(result.reason)) {
      console.error(`Failed to load ${label}:`, result.reason);
    }
    return [];
  };

  const refreshData = useCallback(() => {
    refreshControllerRef.current?.abort();
    const controller = new AbortController();
    refreshControllerRef.current = controller;
    setLoading(true);
    const baseRequests = [
      api.getProducts({ signal: controller.signal }),
      api.getArticles({ signal: controller.signal }),
      api.getHeroSlides({ signal: controller.signal }),
      api.getSupplies({ signal: controller.signal }),
    ];
    const protectedRequests = isManager
      ? [
          api.getOrders({ signal: controller.signal }),
          api.getAddresses({ signal: controller.signal }),
          api.getUsers({ signal: controller.signal }),
        ]
      : user
        ? [
            api.getMyOrders({ signal: controller.signal }),
            api.getAddresses({ signal: controller.signal }),
            Promise.resolve([] as User[]),
          ]
        : [Promise.resolve([] as Order[]), Promise.resolve([] as Address[]), Promise.resolve([] as User[])];

    Promise.allSettled([...baseRequests, ...protectedRequests])
      .then((results) => {
        if (controller.signal.aborted || refreshControllerRef.current !== controller) {
          return;
        }

        const [productsResult, articlesResult, heroResult, suppliesResult, ordersResult, addressesResult, usersResult] = results as [
          PromiseSettledResult<Reptile[]>,
          PromiseSettledResult<Article[]>,
          PromiseSettledResult<HeroSlide[]>,
          PromiseSettledResult<Supply[]>,
          PromiseSettledResult<Order[]>,
          PromiseSettledResult<Address[]>,
          PromiseSettledResult<User[]>,
        ];

        const relevantProtectedResults = isManager
          ? [ordersResult, addressesResult, usersResult]
          : user
            ? [ordersResult, addressesResult]
            : [];

        if (
          relevantProtectedResults.length > 0 &&
          relevantProtectedResults.every(
            (result) => result.status === 'rejected' && isUnauthorizedApiError(result.reason),
          )
        ) {
          logout();
          return;
        }

        setProducts(readArrayResult('products', productsResult));
        setArticles(readArrayResult('articles', articlesResult));
        setHeroSlides(readArrayResult('hero slides', heroResult));
        setSupplies(readArrayResult('supplies', suppliesResult));
        setOrders(readArrayResult('orders', ordersResult));
        setAddresses(readArrayResult('addresses', addressesResult));
        setUsers(readArrayResult('users', usersResult));

        setBackendAvailable(results.every((result) => result.status === 'fulfilled'));
      })
      .catch((error) => {
        if (isAbortApiError(error)) {
          return;
        }
        console.error(error);
        setBackendAvailable(false);
      })
      .finally(() => {
        if (!controller.signal.aborted && refreshControllerRef.current === controller) {
          setLoading(false);
        }
      });
  }, [isManager, logout, user]);

  useEffect(() => {
    refreshData();
  }, [refreshData, user?.id, user?.role]);

  useEffect(() => () => {
    refreshControllerRef.current?.abort();
  }, []);

  const addProduct = (product: Reptile) => {
    api.saveProduct(product).then(() => refreshData()).catch(console.error);
  };

  const deleteProduct = (id: number) => {
    api.deleteProduct(id).then(() => refreshData()).catch(console.error);
  };

  const addAddress = (address: Address) => {
    api.saveAddress(address).then(() => refreshData()).catch(console.error);
  };

  const removeAddress = (id: number) => {
    api.deleteAddress(id).then(() => refreshData()).catch(console.error);
  };

  const addArticle = (article: Article) => {
    api.saveArticle(article).then(() => refreshData()).catch(console.error);
  };

  const deleteArticle = (id: number) => {
    api.deleteArticle(id).then(() => refreshData()).catch(console.error);
  };

  const saveHeroSlide = (slide: HeroSlide) => {
    api.saveHeroSlide(slide).then(() => refreshData()).catch(console.error);
  };

  const deleteHeroSlide = (id: string) => {
    api.deleteHeroSlide(id).then(() => refreshData()).catch(console.error);
  };

  const createOrder = async (order: Order): Promise<Order | null> => {
    try {
      const saved = await api.saveOrder(order);
      refreshData();
      return saved;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const updateOrder = (id: string, status: Order['status']) => {
    api.updateOrderStatus(id, status).then(() => refreshData()).catch(console.error);
  };

  const deleteOrder = (id: string) => {
    api.deleteOrder(id).then(() => refreshData()).catch(console.error);
  };

  const updateOrderPaymentStatus = (orderId: string, paymentStatus: Order['paymentVerificationStatus'], rejectionReason?: string, nextStatus?: Order['status'], paidAmount?: number) => {
    api.updateOrderPaymentStatus(orderId, paymentStatus, rejectionReason, nextStatus, paidAmount).then(() => refreshData()).catch(console.error);
  };

  const updateUser = (user: User) => {
    api.saveUser(user).then(() => refreshData()).catch(console.error);
  };

  const deleteUser = (_id: string) => {
    refreshData();
  };

  const addSupply = (supply: Supply) => {
    api.saveSupply(supply).then(() => refreshData()).catch(console.error);
  };

  const deleteSupply = (id: number) => {
    api.deleteSupply(id).then(() => refreshData()).catch(console.error);
  };

  return (
    <DatabaseContext.Provider value={{
      products,
      orders,
      addresses,
      users,
      articles,
      heroSlides,
      supplies,
      loading,
      backendAvailable,
      dataSource: 'api',
      addProduct,
      deleteProduct,
      addAddress,
      removeAddress,
      createOrder,
      updateOrder,
      deleteOrder,
      updateOrderPaymentStatus,
      addArticle,
      deleteArticle,
      saveHeroSlide,
      deleteHeroSlide,
      updateUser,
      deleteUser,
      addSupply,
      deleteSupply,
      refreshData
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
};
