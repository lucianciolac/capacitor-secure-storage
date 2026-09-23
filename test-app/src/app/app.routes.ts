import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "home",
    loadComponent: async () => (await import("./home/home.page")).HomePageComponent,
  },
  {
    path: "**",
    redirectTo: "home",
    pathMatch: "full",
  },
];
