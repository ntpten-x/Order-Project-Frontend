import RedirectPage from "@/components/navigation/RedirectPage";
import { Layout } from "antd";

export default function POSPage() {
  return (
    <Layout style={{ minHeight: "100%", background: "transparent" }}>
      <Layout.Content style={{ background: "transparent" }}>
        <RedirectPage to="/pos/channels" label="กำลังไปหน้าขาย..." />
      </Layout.Content>
    </Layout>
  );
}
