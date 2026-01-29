/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: process.env.DARK_MODE ? process.env.DARK_MODE : "class",
    content: ["./src/**/*.{html,js,jsx,ts,tsx,mdx}"],
    presets: [require("nativewind/preset")],
    important: "html",
    theme: {
        extend: {
            colors: {
                primary: {
                    100: "rgb(var(--color-primary-100)/<alpha-value>)",
                    500: "rgb(var(--color-primary-500)/<alpha-value>)",
                },
                urgent: {
                    500: "rgb(var(--color-urgent-500)/<alpha-value>)",
                },
                warning: {
                    500: "rgb(var(--color-warning-500)/<alpha-value>)",
                },
                typography: {
                    400: "rgb(var(--color-typography-400)/<alpha-value>)",
                    500: "rgb(var(--color-typography-500)/<alpha-value>)",
                    white: "#FFFFFF",
                    gray: "#D4D4D4",
                    black: "#181718",
                },
                outline: {
                    500: "rgb(var(--color-outline-500)/<alpha-value>)",
                },
                background: "rgb(var(--color-background)/<alpha-value>)",
            },
            fontWeight: {
                extrablack: "950",
            },
            fontSize: {
                "2xs": "10px",
            },
            boxShadow: {
                "hard-1": "-2px 2px 8px 0px rgba(38, 38, 38, 0.20)",
                "hard-2": "0px 3px 10px 0px rgba(38, 38, 38, 0.20)",
                "hard-3": "2px 2px 8px 0px rgba(38, 38, 38, 0.20)",
                "hard-4": "0px -3px 10px 0px rgba(38, 38, 38, 0.20)",
                "hard-5": "0px 2px 10px 0px rgba(38, 38, 38, 0.10)",
                "soft-1": "0px 0px 10px rgba(38, 38, 38, 0.1)",
                "soft-2": "0px 0px 20px rgba(38, 38, 38, 0.2)",
                "soft-3": "0px 0px 30px rgba(38, 38, 38, 0.1)",
                "soft-4": "0px 0px 40px rgba(38, 38, 38, 0.1)",
            },
        },
    },
};
