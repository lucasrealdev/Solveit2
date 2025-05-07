import React from "react";
import { TouchableOpacity, Alert } from "react-native";
import CustomIcons from "@/assets/icons/CustomIcons";
import { useToast } from "./ToastProvider";

interface TooltipProps {
  title: string;
  content: string;
  iconSize?: number;
  iconColor?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  title,
  content,
  iconSize = 40,
  iconColor = "#475569",
}) => {
  const { showToast } = useToast();

  const handleOpen = () => {
    showToast({
      title: title,
      message: content,
      duration: 10000,
      type: 'info',
      position: 'top',
      buttons: [
        { text: 'Close', onPress: () => { } },
      ],
    });
  };

  return (
    <TouchableOpacity onPress={handleOpen}>
      <CustomIcons name="info" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

export default Tooltip;
