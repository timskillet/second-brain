/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // all your source files
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require('tailwind-scrollbar'), // add the scrollbar plugin here
    ],
}