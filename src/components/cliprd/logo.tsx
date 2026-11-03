export function Logo({
  size = "md",
  slogan = false,
}: {
  size?: "sm" | "md" | "lg";
  slogan?: boolean;
}) {
  const height = size === "sm" ? "h-8" : size === "lg" ? "h-20 md:h-28" : "h-11";
  return (
    <span className="inline-flex max-w-full flex-col items-start gap-2">
      <img
        src="/brand/cliprd-wordmark.png"
        alt="CLIPRD"
        className={`${height} w-auto max-w-full object-contain`}
      />
      {slogan ? (
        <span className="text-[0.65rem] font-bold tracking-[0.16em] text-neon">
          CONVIERTE VISUALIZACIONES EN DINERO
        </span>
      ) : null}
    </span>
  );
}
