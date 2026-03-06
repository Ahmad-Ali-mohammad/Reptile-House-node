import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { Reptile, Order, Address, User, Article, HeroSlide, Supply } from '../types';
import { api } from '../services/api';
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
  updateOrderPaymentStatus: (orderId: string, paymentStatus: Order['paymentVerificationStatus'], rejectionReason?: string, nextStatus?: Order['status']) => void;
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
  const { user } = useAuth();
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

  const readArrayResult = <T,>(label: string, result: PromiseSettledResult<T[]>) => {
    if (result.status === 'fulfilled') {
      return Array.isArray(result.value) ? result.value : [];
    }

    console.error(`Failed to load ${label}:`, result.reason);
    return [];
  };

  const refreshData = useCallback(() => {
    setLoading(true);
    const baseRequests = [
      api.getProducts(),
      api.getArticles(),
      api.getHeroSlides(),
      api.getSupplies(),
    ];
    const protectedRequests = isManager
      ? [api.getOrders(), api.getAddresses(), api.getUsers()]
      : user
        ? [api.getMyOrders(), api.getAddresses(), Promise.resolve([] as User[])]
        : [Promise.resolve([] as Order[]), Promise.resolve([] as Address[]), Promise.resolve([] as User[])];

    Promise.allSettled([...baseRequests, ...protectedRequests])
      .then((results) => {
        const [productsResult, articlesResult, heroResult, suppliesResult, ordersResult, addressesResult, usersResult] = results as [
          PromiseSettledResult<Reptile[]>,
          PromiseSettledResult<Article[]>,
          PromiseSettledResult<HeroSlide[]>,
          PromiseSettledResult<Supply[]>,
          PromiseSettledResult<Order[]>,
          PromiseSettledResult<Address[]>,
          PromiseSettledResult<User[]>,
        ];

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
        console.error(error);
        setBackendAvailable(false);
      })
      .finally(() => setLoading(false));
  }, [isManager, user?.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData, user?.id, user?.role]);

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

  const updateOrderPaymentStatus = (orderId: string, paymentStatus: Order['paymentVerificationStatus'], rejectionReason?: string, nextStatus?: Order['status']) => {
    api.updateOrderPaymentStatus(orderId, paymentStatus, rejectionReason, nextStatus).then(() => refreshData()).catch(console.error);
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
