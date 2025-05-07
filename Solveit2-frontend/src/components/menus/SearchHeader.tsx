import { TextInput, View, useWindowDimensions, Text, ActivityIndicator } from "react-native";
import { useState } from "react";
import CustomIcons from "@/assets/icons/CustomIcons";
import colors from "@/constants/colors";
import Button from "../Button";
import { useSmartNavigation } from "@/utils/navigation";

const SearchHeader = () => {
    const { width } = useWindowDimensions();
    const isColumn = width <= 520;

    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");

    const { navigateTo } = useSmartNavigation();

    const handleSearch = () => {
        if (!search.trim()) return;
        setIsLoading(true);
        // Simula busca
        setTimeout(() => {
            setIsLoading(false);
            console.log("Buscar por:", search);
        }, 800);
    };

    return (
        <View
            className={`bg-white w-full flex px-3 py-[21px] border-b border-borderStandardLight gap-2 ${isColumn ? "flex-col" : "flex-row"
                }`}
        >
            {/* Campo de pesquisa */}
            <View
                aria-label="containerInput"
                className="border border-borderStandardLight rounded-full flex flex-row gap-3 px-3 py-[8px] items-center flex-1"
            >
                <TextInput
                    placeholder="Pesquise problemas"
                    value={search}
                    onChangeText={setSearch}
                    onSubmitEditing={handleSearch}
                    className="flex flex-1 outline-none text-base text-textStandardDark font-medium"
                />
                <View className="gap-2 flex-row">
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.textStandardDark.standard} />
                    ) : (
                        <Button scale={1.09} onPress={handleSearch}>
                            <CustomIcons name="search" size={20} color={colors.textSecondary.standard} />
                        </Button>
                    )}
                    <Button scale={1.09}>
                        <CustomIcons name="filter" size={20} color={colors.textSecondary.standard} />
                    </Button>
                </View>
            </View>

            {/* Botão de contribuição */}
            <Button
                onPress={() => navigateTo("createpost")}
                className="rounded-full gap-[10px] px-5 py-3"
                backgroundColor={colors.accentStandardDark.standard}
                hoverInColor={colors.accentStandardDark.hover}
                pressInColor={colors.accentStandardDark.pressIn}
                scale={1.015}
            >
                <Text className="text-white font-bold">Contribuir no mundo</Text>
                <CustomIcons name="more" size={20} color="#fff" />
            </Button>
        </View>
    );
};

export default SearchHeader;
