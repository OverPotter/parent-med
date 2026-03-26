/**
 * Layout клиентской части: общий Layout с навигацией по разделам.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { fetchFamilies } from "@shared/api/families";
import { Layout } from "@shared/components/Layout";
import { useAppStore } from "@shared/store/useAppStore";

const desktopNavLinks = [
  { to: "/home", label: "Главная" },
  {
    to: "/illnesses/active",
    label: "Болезни",
    mobileLabel: "Болезни",
    exactActivePaths: ["/illnesses/active", "/children/:childId/illness"],
  },
  {
    to: "/children",
    label: "Дети",
    mobileLabel: "Дети",
    exactActivePaths: ["/children", "/children/:childId"],
  },
  { to: "/medicine-cabinet", label: "Аптечка", mobileLabel: "Аптечка" },
  {
    to: "/more",
    label: "Ещё",
    mobileLabel: "Ещё",
    exactActivePaths: ["/more", "/account", "/about", "/family", "/illnesses/history"],
  },
];

const mobileNavLinks = [
  {
    to: "/home",
    label: "Главная",
    mobileLabel: "Главная",
  },
  {
    to: "/illnesses/active",
    label: "Активные болезни",
    mobileLabel: "Болезни",
    exactActivePaths: ["/illnesses/active", "/children/:childId/illness"],
  },
  {
    to: "/children",
    label: "Дети",
    mobileLabel: "Дети",
    exactActivePaths: ["/children", "/children/:childId"],
  },
  { to: "/medicine-cabinet", label: "Аптечка", mobileLabel: "Аптечка" },
  {
    to: "/more",
    label: "Ещё",
    mobileLabel: "Ещё",
    exactActivePaths: ["/more", "/account", "/about", "/family", "/illnesses/history"],
  },
];

export function ClientLayout() {
  const accountId = useAppStore((s) => s.accountId);
  const currentFamilyId = useAppStore((s) => s.currentFamilyId);
  const currentFamilyName = useAppStore((s) => s.currentFamilyName);
  const setCurrentFamily = useAppStore((s) => s.setCurrentFamily);
  const { data: families = [], isSuccess } = useQuery({
    queryKey: ["families", accountId],
    queryFn: fetchFamilies,
    enabled: !!accountId,
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
    <Layout navLinks={desktopNavLinks} mobileNavLinks={mobileNavLinks} showCurrentFamily>
      <Outlet />
    </Layout>
  );
}
