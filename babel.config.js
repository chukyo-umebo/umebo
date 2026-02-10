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
            [
                "react-native-iconify/babel",
                {
                    icons: [
                        "bxs:home-alt-2",
                        "bxs:bus",
                        "bxs:notepad",
                        "bxs:calendar-alt",
                        "bxs:time",
                        "bxs:cog",
                        "bxs:pencil",
                        "bxs:trash-alt",
                        "twemoji:face-screaming-in-fear",
                        "twemoji:smiling-face-with-smiling-eyes",
                        "octicon:chevron-down-12",
                        "octicon:chevron-up-12",
                    ],
                },
            ],
            "react-native-worklets/plugin",
        ],
    };
};
