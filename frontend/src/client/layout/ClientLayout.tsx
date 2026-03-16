/**
 * Layout клиентской части: общий Layout с навигацией по разделам.
 */

import { Outlet } from "react-router-dom";
import { Layout } from "@shared/components/Layout";

const clientNavLinks = [
  { to: "/", label: "Главная" },
  { to: "/family", label: "Семья" },
  { to: "/children", label: "Дети" },
  { to: "/medicine-cabinet", label: "Аптечка" },
];

export function ClientLayout() {
  return (
    <Layout navLinks={clientNavLinks}>
      <Outlet />
    </Layout>
  );
}
