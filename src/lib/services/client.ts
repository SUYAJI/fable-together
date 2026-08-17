import { isDemoMode } from "@/lib/app-mode"
import type { AppServices } from "@/lib/services/contracts"
import { demoClientServices } from "@/lib/services/demo/client-services"
import { productionClientServices } from "@/lib/services/production/client-services"

let services: AppServices | undefined

export function getClientServices(): AppServices {
  services ??= isDemoMode() ? demoClientServices : productionClientServices
  return services
}
