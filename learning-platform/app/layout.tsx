import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Header from "./components/Header";
import { InstructorModeProvider } from "./context/InstructorModeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisconsin Rural Entrepreneurship Legal Hub",
  description: "Interactive case studies for entrepreneurs and legal professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <InstructorModeProvider>
              <Header />
              {children}
            </InstructorModeProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
