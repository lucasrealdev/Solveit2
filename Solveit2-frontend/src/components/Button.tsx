import React, { useState, type ReactElement } from 'react';
import {
  Pressable,
  PressableProps,
  Animated,
  View,
  ActivityIndicator,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import tinycolor from 'tinycolor2';

interface ButtonProps extends PressableProps {
  children: React.ReactNode;
  className?: string;
  classNameContainer?: string;
  backgroundColor?: string;
  hoverInColor?: string;
  pressInColor?: string;
  isLoading?: boolean;
  scale?: number;
  applyChildColors?: boolean;
}

const convertToDimensionValue = (value: string): DimensionValue => {
  const num = parseInt(value);
  return isNaN(num) ? (value as DimensionValue) : num;
};

const extractPositionStyle = (
  classString = ''
): { positionStyle: ViewStyle; otherClasses: string } => {
  const classes = classString.split(' ');
  const style: ViewStyle = {};
  const rest: string[] = [];

  for (const cls of classes) {
    if (cls === 'absolute') style.position = 'absolute';
    else if (cls.startsWith('top-')) style.top = convertToDimensionValue(cls.slice(4));
    else if (cls.startsWith('bottom-')) style.bottom = convertToDimensionValue(cls.slice(7));
    else if (cls.startsWith('left-')) style.left = convertToDimensionValue(cls.slice(5));
    else if (cls.startsWith('right-')) style.right = convertToDimensionValue(cls.slice(6));
    else rest.push(cls);
  }

  return { positionStyle: style, otherClasses: rest.join(' ') };
};

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  classNameContainer = '',
  backgroundColor = 'transparent', // azul padrão
  hoverInColor,
  pressInColor,
  isLoading = false,
  scale = 1,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  applyChildColors = false,
  ...props
}) => {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));

  const { positionStyle, otherClasses } = extractPositionStyle(className);

  const isTransparent = backgroundColor === 'transparent';
  const computedHoverColor = hoverInColor ?? (isTransparent ? 'transparent' : tinycolor(backgroundColor).lighten(4).toHexString());
  const computedPressColor = pressInColor ?? (isTransparent ? 'transparent' : tinycolor(backgroundColor).darken(4).toHexString());

  const getBackgroundColor = () => {
    if (applyChildColors) return backgroundColor;
    if (pressed) return computedPressColor;
    if (hovered) return computedHoverColor;
    return backgroundColor;
  };

  const handleHoverIn = (e: any) => {
    setHovered(true);
    onHoverIn?.(e);
    scaleButton(scale);
  };

  const handleHoverOut = (e: any) => {
    setHovered(false);
    onHoverOut?.(e);
    scaleButton(1);
  };

  const handlePressIn = (e: any) => {
    setPressed(true);
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    setPressed(false);
    onPressOut?.(e);
  };

  const scaleButton = (value: number) => {
    Animated.spring(animatedValue, {
      toValue: value,
      useNativeDriver: true,
    }).start();
  };

  const applyChildColor = (child: React.ReactNode) => {
    if (React.isValidElement(child)) {
      const { type, props: childProps } = child;
      const color = pressed ? computedPressColor : hovered ? computedHoverColor : undefined;

      if (!color) return child;

      // Verifica se o componente é CustomIcons (ajuste o nome conforme necessário)
      if (type && (type as any).name === 'CustomIcons') {
        return React.cloneElement(child as ReactElement, { color });
      }

      // Aplica a cor via style para outros componentes
      return React.cloneElement(child as ReactElement, {
        style: { ...childProps.style, color },
      });
    }
    return child;
  };

  return (
    <View style={positionStyle} className={`${classNameContainer}`}>
      <Animated.View style={{ transform: [{ scale: animatedValue }], flex: 1}}>
        <Pressable
          {...props}
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isLoading}
          style={{
            backgroundColor: getBackgroundColor(),
            userSelect: 'none',
          }}
          className={`flex items-center justify-center flex-row ${otherClasses}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : applyChildColors ? (
            React.Children.map(children, (child) => applyChildColor(child))
          ) : (
            children
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
};

export default Button;