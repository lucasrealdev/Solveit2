import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, type LayoutChangeEvent, type NativeSyntheticEvent, type TextInputContentSizeChangeEventData } from "react-native";
import CustomIcons from "@/assets/icons/CustomIcons";
import type IconNames from "@/constants/icons-names";

interface CustomTextInputProps {
  title: string;
  placeholder: string;
  maxLength: number;
  minLength?: number;
  icon?: IconNames;
  password?: boolean;
  strength?: boolean;
  multiline?: boolean;
  inputFilter?: RegExp;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url";
  maskType?: "number" | "cep" | "phone" | "cpf" | "cnpj";
  showCharCount?: boolean;
  focusColor?: string;
  blurColor?: string;
  onChangeText?: (text: string) => void;
}

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const [strength, setStrength] = useState({
    hasMinLength: false,
    hasUpperLower: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    setStrength({
      hasMinLength: password.length >= 8,
      hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const level = Object.values(strength).filter(Boolean).length;

  return (
    <View className="mt-2">
      <View className="flex-row gap-1">
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            className={`flex-1 h-1 rounded-full ${index < level ? "bg-green-500" : "bg-gray-200"
              }`}
          />
        ))}
      </View>

      <Text className="text-sm text-gray-600 mt-2">
        Password strength: {["Fraca", "Razoável", "Boa", "Forte", "Muito Forte"][level]}
      </Text>

      <View className="mt-2">
        <Text
          className={`text-xs ${strength.hasMinLength ? "text-green-500" : "text-gray-500"
            }`}
        >
          • Mínimo 8 caracteres
        </Text>
        <Text
          className={`text-xs ${strength.hasUpperLower ? "text-green-500" : "text-gray-500"
            }`}
        >
          • Letras maiúsculas e minúsculas
        </Text>
        <Text
          className={`text-xs ${strength.hasNumber ? "text-green-500" : "text-gray-500"
            }`}
        >
          • Pelo menos um número
        </Text>
        <Text
          className={`text-xs ${strength.hasSpecialChar ? "text-green-500" : "text-gray-500"
            }`}
        >
          • Pelo menos um caractere especial
        </Text>
      </View>
    </View>
  );
};

const CustomTextInput = ({
  title,
  placeholder,
  maxLength,
  minLength = 8,
  inputMode = "text",
  inputFilter,
  icon,
  password = false,
  strength = false,
  maskType,
  showCharCount = false,
  focusColor = "#01b297",
  blurColor = "#0174b2",
  onChangeText,
  multiline = false,
}: CustomTextInputProps) => {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const applyMask = (text: string) => {
    switch (maskType) {
      case "number":
        return text.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      case "cep":
        return text.replace(/(\d{5})(\d{3})/, "$1-$2");
      case "phone":
        return text
          .replace(/^\+55|[^0-9]/g, "")
          .replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      case "cpf":
        return text.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      case "cnpj":
        return text.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          "$1.$2.$3/$4-$5"
        );
      default:
        return text;
    }
  };

  const handleTextChange = (text: string) => {
    if (inputFilter) text = text.replace(inputFilter, "");
    const masked = applyMask(text);
    setValue(masked);
    if (onChangeText) {
      onChangeText(masked);
    }
  };

  const showError = !isFocused && value.length > 0 && value.length < minLength;
  const remainingChars = maxLength - value.length;
  const borderColor = isFocused ? focusColor : blurColor;

  return (
    <View className="w-full gap-2">
      <Text className="font-bold text-textStandardDark">{title}</Text>

      <View
        className={`flex-row items-center gap-2 rounded-xl border bg-white px-3 min-h-12`}
        style={{
          borderColor: borderColor,
        }}
      >
        {
          icon &&
          <View className="h-full flex justify-start items-center pt-[15px]">
            <CustomIcons name={icon} size={20} color="#475569" />
          </View>
        }

        <TextInput
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          secureTextEntry={password && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
          className="flex-1 text-base text-slate-600 outline-none"
          style={{
            height: multiline ? 120 : 48, // altura padrão maior para multiline
            marginVertical: multiline ? 12 : undefined,
            paddingEnd: 5,
          }}
        />

        {password && (
          <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <CustomIcons
              name={isPasswordVisible ? "openEye" : "closeEye"}
              size={22}
              color="#CBD5E1"
            />
          </Pressable>
        )}
      </View>

      {showError && (
        <Text className="pl-1 text-sm text-red-500">
          O texto deve ter pelo menos {minLength} caracteres.
        </Text>
      )}

      {showCharCount && (
        <Text className="text-sm text-textSecondary">
          {remainingChars} Letras Restantes
        </Text>
      )}

      {strength && password && <PasswordStrengthIndicator password={value} />}
    </View>
  );
};

export default CustomTextInput;