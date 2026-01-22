/** @typedef  {import("prettier").Config} PrettierConfig */
/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig } */
const config = {
    plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],
    importOrder: [
        "^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
        "^(next/(.*)$)|^(next$)",
        "^(expo(.*)$)|^(expo$)",
        "<THIRD_PARTY_MODULES>",
        "",
        "^@acm/(.*)$",
        "^acm/(.*)$",
        "^@/",
        "^~/",
        "^[../]",
        "^[./]",
    ],
    importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
    importOrderTypeScriptVersion: "5.9.2",
    arrowParens: "always",
    printWidth: 120,
    singleQuote: false,
    semi: true,
    trailingComma: "es5",
    tabWidth: 4,
    proseWrap: "always",
};

export default config;
