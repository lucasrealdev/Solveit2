import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, Dimensions, type ViewStyle } from 'react-native';
import { X, CheckCircle } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export type ToastPosition = 'top' | 'bottom' | 'center';
export type ToastType = 'success' | 'error' | 'info';

export interface ToastButton {
  text: string;
  onPress: () => void;
}

export interface ToastProps {
  id: string;
  title: string;
  message: string;
  duration?: number;
  buttons?: ToastButton[];
  position?: ToastPosition;
  type?: ToastType;
}

interface ToastContextProps {
  showToast: (toast: Omit<ToastProps, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

const MAX_TOASTS = 2;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const animatedValuesY = useRef<Record<string, Animated.Value>>(Object.create(null)).current;
  const animatedValuesX = useRef<Record<string, Animated.Value>>(Object.create(null)).current;
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const isMountedRef = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clear all timeouts
      Object.values(timeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const showToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = `${toast.title}-${toast.message}`;
    
    // If this toast is already showing, don't show it again
    if (toasts.find(t => t.id === id)) return;
    
    // Check if we need to remove oldest toast
    if (toasts.length >= MAX_TOASTS) {
      const oldestToast = toasts[toasts.length - 1];
      if (oldestToast) {
        hideToastWithSlide(oldestToast.id);
      }
    }

    const newToast: ToastProps = { id, ...toast };
    
    // Initialize both X and Y animated values
    animatedValuesY[id] = new Animated.Value(-100);
    animatedValuesX[id] = new Animated.Value(0);

    setToasts(current => [newToast, ...current]);
    
    // Animate entering from top
    Animated.spring(animatedValuesY[id], {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    // Set timeout to hide toast
    const duration = toast.duration || 4000;
    timeoutsRef.current[id] = setTimeout(() => {
      if (isMountedRef.current) {
        hideToast(id);
      }
    }, duration);
  }, [toasts]);

  // Hide toast with slide up animation
  const hideToast = useCallback((id: string) => {
    // Clear existing timeout for this toast
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }

    // Check if animation value still exists
    if (!animatedValuesY[id]) return;

    Animated.timing(animatedValuesY[id], {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (isMountedRef.current) {
        setToasts(prev => prev.filter(t => t.id !== id));
        delete animatedValuesY[id];
        delete animatedValuesX[id];
      }
    });
  }, []);

  // Hide toast with slide to the side animation
  const hideToastWithSlide = useCallback((id: string) => {
    // Clear existing timeout for this toast
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }

    // Check if animation value still exists
    if (!animatedValuesX[id]) return;

    Animated.timing(animatedValuesX[id], {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (isMountedRef.current) {
        setToasts(prev => prev.filter(t => t.id !== id));
        delete animatedValuesY[id];
        delete animatedValuesX[id];
      }
    });
  }, []);

  const getContainerStyle = (position?: ToastPosition): ViewStyle => {
    switch (position) {
      case 'bottom':
        return { position: 'absolute', width: '100%', paddingHorizontal: 16, bottom: 20, zIndex: 999, alignItems: 'center' };
      case 'center':
        return { position: 'absolute', width: '100%', paddingHorizontal: 16, top: '40%', zIndex: 999, alignItems: 'center' };
      case 'top':
      default:
        return { position: 'absolute', width: '100%', paddingHorizontal: 16, top: 20, zIndex: 999, alignItems: 'center' };
    }
  };

  const getIconByType = (type?: ToastType) => {
    switch (type) {
      case 'error':
        return <X size={24} color="#ef4444" />;
      case 'info':
        return <CheckCircle size={24} color="#3b82f6" />;
      case 'success':
      default:
        return <CheckCircle size={24} color="#22c55e" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View style={getContainerStyle(toasts[0]?.position)}>
        {toasts.map((toast) => {
          const animatedY = animatedValuesY[toast.id];
          const animatedX = animatedValuesX[toast.id];
          if (!animatedY || !animatedX) return null;
          
          return (
            <Animated.View
              key={toast.id}
              style={{
                transform: [
                  { translateY: animatedY },
                  { translateX: animatedX }
                ],
                marginBottom: 10,
                backgroundColor: 'white',
                padding: 16,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                width: '100%',
                maxWidth: 400,
              }}>
              <View style={{ flexDirection: 'row', flex: 1, gap: 12 }}>
                <View style={{ paddingTop: 4 }}>
                  {getIconByType(toast.type)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{toast.title}</Text>
                  <Text style={{ color: '#4B5563', fontSize: 14, marginBottom: 8 }}>{toast.message}</Text>
                  {toast.buttons?.length ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {toast.buttons.map((btn, i) => (
                        <Pressable
                          key={i}
                          onPress={() => {
                            btn.onPress();
                            hideToast(toast.id);
                          }}
                          style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                        >
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#1f2937' }}>{btn.text}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
              <Pressable onPress={() => hideToast(toast.id)} style={{ padding: 4 }}>
                <X size={16} color="#333" />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};