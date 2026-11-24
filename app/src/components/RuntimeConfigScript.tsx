import { getRuntimeConfig } from "@/lib/runtimeConfig";

export default function RuntimeConfigScript() {
  const config = getRuntimeConfig();
  return (
    <script
      id="runtime-config-bootstrap"
      dangerouslySetInnerHTML={{
        __html: `window.__RUNTIME_CONFIG__ = ${JSON.stringify(config)};`,
      }}
    />
  );
}
