export function shouldDisableGlobalIosBackSwipe(pathname: string, search: string): boolean {
  const pillboxMode =
    pathname === "/pillbox" ? new URLSearchParams(search).get("mode") : null;

  return (
    pathname === "/" ||
    pathname === "/auth" ||
    pathname === "/start" ||
    pathname === "/children" ||
    pathname === "/medicine-cabinet" ||
    pathname === "/illnesses/active" ||
    (pathname === "/pillbox" && !pillboxMode)
  );
}
