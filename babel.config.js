module.exports = function (api) {
    api.cache(true);

    return {
        presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],

        plugins: [
            [
                "module-resolver",
                {
                    root: ["./"],

                    alias: {
                        "tailwind.config": "./tailwind.config.js",
                    },
                },
            ],
            "react-native-worklets/plugin",
            [
                "react-native-iconify/babel",
                {
                    icons: ["bxs:home-alt-2", "bxs:bus", "bxs:notepad", "bxs:calendar-alt", "bxs:time"],
                },
            ],
        ],
    };
};
