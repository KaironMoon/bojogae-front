/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
export default function ClaimInsurerLogo({ insurer }) {
  const [failed, setFailed] = useState(false);
  const logo = insurer.logo;
  useEffect(() => {
    setFailed(false);
    if (!logo?.path) return;
    const image = new Image();
    image.onerror = () => setFailed(true);
    image.src = logo.path;
    return () => {
      image.onerror = null;
    };
  }, [logo?.path]);
  if (!logo || failed)
    return (
      <span
        className="claim-logo-placeholder"
        aria-label={`${insurer.name} 로고 없음`}
      >
        <span>LOGO AREA</span>
      </span>
    );
  return (
    <svg
      className="MuiBox-root css-1gpwhzn"
      viewBox={logo.view_box}
      aria-hidden="true"
      style={{ width: 88, height: 36, flexShrink: 0 }}
    >
      <image href={logo.path} width={logo.width} height={logo.height} />
    </svg>
  );
}
