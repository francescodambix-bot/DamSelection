export const metadata = {
  title: "Vinted Analytics AI",
  description: "Dashboard personale per reselling su Vinted",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
