import React, { useState } from "react";
import { TextInput, TextInputProps, TouchableOpacity, View } from "react-native";
import { Iconify } from "react-native-iconify";

export interface InputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
    value: string;
    onChangeText: (text: string) => void;
    leftIcon?: string;
    isPassword?: boolean;
    alphanumeric?: boolean;
}

export function Input({
    value,
    onChangeText,
    leftIcon,
    isPassword = false,
    alphanumeric = false,
    placeholder,
    className,
    ...props
}: InputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);

    const handleChangeText = (text: string) => {
        if (alphanumeric) {
            if (/^[a-zA-Z0-9]*$/.test(text)) {
                onChangeText(text);
            }
        } else {
            onChangeText(text);
        }
    };

    const containerClasses = `w-full flex-row items-center border-2 rounded-[20px] px-5 py-3 h-[54px] justify-between transition-colors ${
        isFocused ? "bg-[#eff3fd] border-[#2e6bff]" : "bg-[#f9f7f6] border-[#e1e1e1]"
    } ${className || ""}`;

    const iconColor = isFocused || value ? "#1b1a19" : "#adacaa";

    return (
        <View className={containerClasses}>
            <View className="mr-2 flex-1 flex-row items-center">
                {leftIcon && <Iconify icon={leftIcon} size={20} color={iconColor} />}
                <TextInput
                    className={`flex-1 text-base font-medium text-[#1b1a19] ${leftIcon ? "ml-3" : ""}`}
                    placeholder={placeholder}
                    placeholderTextColor="#adacaa"
                    secureTextEntry={isPassword && !isVisible}
                    value={value}
                    onChangeText={handleChangeText}
                    autoCapitalize="none"
                    onFocus={onFocus}
                    onBlur={onBlur}
                    {...props}
                />
            </View>

            {isPassword && (
                <TouchableOpacity onPress={() => setIsVisible(!isVisible)} activeOpacity={0.7}>
                    <Iconify icon={isVisible ? "bxs:hide" : "bxs:show"} size={20} color={iconColor} />
                </TouchableOpacity>
            )}
        </View>
    );
}
