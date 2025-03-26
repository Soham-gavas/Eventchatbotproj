import "./global.css";

export const metadata = {
    title: "EventGPT",
    description: "EventGPT is a GPT-3 powered event description generator.",
}

const RootLayout = ({ children }) => {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}

export default RootLayout