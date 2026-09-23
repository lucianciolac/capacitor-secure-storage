import { enableProdMode, ErrorHandler } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, withPreloading, PreloadAllModules } from "@angular/router";
import { RouteReuseStrategy } from "@angular/router";
import { provideIonicAngular } from "@ionic/angular/provide";
import { IonicRouteStrategy } from "@ionic/angular/lazy";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";
import { environment } from "./environments/environment";
import { GlobalErrorHandler } from "./app/global-error-handler";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
}).catch((err) => {
  console.log(err);
});
