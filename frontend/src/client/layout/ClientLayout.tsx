/**
 * Layout клиентской части: общий Layout с навигацией по разделам.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { fetchFamilies } from "@shared/api/families";
import { Layout } from "@shared/components/Layout";
import { useAppStore } from "@shared/store/useAppStore";

const clientNavLinks = [
  { to: "/", label: "Главная" },
  { to: "/family", label: "Семья" },
  { to: "/children", label: "Дети" },
  { to: "/medicine-cabinet", label: "Аптечка" },
];

export function ClientLayout() {
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const { data: families = [], isSuccess } = useQuery({
    queryKey: ["families"],
    queryFn: fetchFamilies,
  });

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    const firstFamily = families[0] ?? null;
    if (!currentFamilyId) {
      if (firstFamily) {
        setCurrentFamily(firstFamily);
      }
      return;
    }
    const family = families.find((item) => item.id === currentFamilyId);
    if (!family) {
      setCurrentFamily(firstFamily);
      return;
    }
    if (family.name !== currentFamilyName) {
      setCurrentFamily(family);
    }
  }, [currentFamilyId, currentFamilyName, families, isSuccess, setCurrentFamily]);

  return (
    <Layout navLinks={clientNavLinks} showCurrentFamily>
      <Outlet />
    </Layout>
  );
}
