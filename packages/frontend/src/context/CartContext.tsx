import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CartLineItem } from "../types/cart.types";
import { Product } from "../types/product.types";

const CART_STORAGE_KEY = "notisability_cart";

interface CartContextValue {
  items: CartLineItem[];
  total: number;
  currency: string;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInCart: (productId: string) => boolean;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadCartFromStorage(): CartLineItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLineItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>(() => loadCartFromStorage());

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((item) => item.productId === product.id)) {
        return prev;
      }

      const newItem: CartLineItem = {
        productId: product.id,
        title: product.title,
        unitPrice: product.price,
        currency: product.currency,
        coverImageUrl: product.coverImageUrl,
      };

      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items]
  );

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice, 0),
    [items]
  );

  const currency = items[0]?.currency ?? "COP";

  return (
    <CartContext.Provider value={{ items, total, currency, addItem, removeItem, isInCart, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
