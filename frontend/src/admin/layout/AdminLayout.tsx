/**
 * Layout админки (MVP: заглушка).
 */

import { Outlet } from "react-router-dom";
import { Layout } from "@shared/components/Layout";

const adminNavLinks = [{ to: "/", label: "Админка" }];

export function AdminLayout() {
  return (
    <Layout navLinks={adminNavLinks}>
      <Outlet />
    </Layout>
  );
}
