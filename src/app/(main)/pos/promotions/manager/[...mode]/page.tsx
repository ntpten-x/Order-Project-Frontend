import RedirectPage from "@/components/navigation/RedirectPage";
import { Layout } from "antd";

export default function PromotionManagePage() {
  return (
    <Layout style={{ minHeight: "100%", background: "transparent" }}>
      <Layout.Content style={{ background: "transparent" }}>
        <RedirectPage to="/pos/discounts" label="กำลังไปหน้าส่วนลด..." />
      </Layout.Content>
    </Layout>
  );
}
